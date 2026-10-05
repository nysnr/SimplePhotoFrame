# SimplePhotoFrame AdMob Banner 安定化仕様書 v3 (1.0.7)

## 1. 問題文
1.0.6 リリースにて AdMob Banner 改修を実施した結果、下記症状が新規に悪化・出現：
1. **iPad 全機種**：スライドショー / 設定画面等、全てのバナー配置箇所で「バナーが 0.1 秒だけ一瞬表示された直後に消滅、その後 2 度と表示されない」事象が必発
2. **iPhone 縦画面**：上記と同症状（一瞬表示で消滅・復旧せず）
3. **iPhone 横画面**：一瞬表示で消滅するも、しばらくすると自動復旧して表示が継続する。但し **「バナーが左に寄りすぎて、右側に広告が描画されない空白の帯が生じる」センタリングずれ** が恒常的に発生

## 2. 悪化した根本原因（既知 Issue 誤認 + 自己破壊ループ）
1.0.6 で追加した 6 項目の Reload Trigger（windowHeight 変化 / onLayout サイズ変化 / layoutKey 変化 / mountToken / Heartbeat getIsReady / DEAD 90s watchdog）は、**互いにループ状態遷移を引き起こし、GAMBannerView を再帰的に unmount → request を N 秒以内に 50 回以上連打する** 自己破壊ループ (Self-DDoS Loop) を生成していた。

各症状のメカニズム：
| 症状 | 自己破壊ループ経路 |
|---|---|
| iPad / iPhone 縦：一瞬表示で消滅 | onLayout → サイズ 10px 閾値判定 → `setContainerWidth(0) + setReloadKey++` → BannerComp unmount → onLayout 再度 fire（横幅 0→containerWidth 増加 → 再度 10px 以上変化として判定）→ Reload → 30ms 周期で 100 回以上連続 unmount → Google AdMob Server が同一 Fingerprint からの大量 request を Rate Limit（IP Level）で 1 時間 BAN → onAdLoaded が最初の 1 回だけ呼ばれ 2 回目以降はサーバーから all no-fill |
| iPhone 横：自動復旧するもセンターずれ | iPhone 横は Compact Width Class のため Jetsam 優先度が高く SDK keep-alive が効く → 1 時間 BAN から 3-5 分で自動解除され Banner が再表示される。但し自己破壊ループ中に計測された古い containerWidth（400px 等）を使って ANCHORED_ADAPTIVE_BANNER の横幅計算を GAM SDK 内部でキャッシュしてしまい、最終的な親 View 幅 844px の左 400px だけに Banner が描画される。→ 右側 444px が空白のセンターずれに見える。 |

## 3. ユーザー / ゴール
- ユーザー：SimplePhotoFrame iPad 5 / iPad A16 / iPhone 12 所有者
- 一次ゴール：iPad 全機種・iPhone 縦横両方で、バナー広告が起動直後から表示され続け、0.1 秒フラッシュ消え・センターずれ・自己破壊ループが発生しない。
- 二次ゴール：3 時間以上連続 Slideshow 放置・Split View 切替・ホーム復帰・Modal 開閉を 10 回繰り返しても Banner が消えない。
- 非ゴール：AdMob SDK 自体の改変・Ad Network 切替・カスタム Native Banner 実装。

## 4. 機能要件 (Functional Requirements)
### FR-01：自己破壊ループ絶対禁止
- プロセス起動以降、いかなる画面遷移・サイズ変化に対しても、**同一 Ad Unit への 1 分間あたりの Banner request 回数は最大 6 回（平均 10 秒に 1 回）を超えてはならない**。
- `reloadKey++` を実行する前には **cooldownDebounce（最小間引き間隔 8 秒）** を必ず通し、前回 reload から 8 秒以内の reload 要求は全て捨てる。
- onLayout でのサイズ変化判定は「閾値 50px 以上且つ変化量が元のサイズの 15% 以上」の場合に限定し、1〜49px の微小なレイアウト揺れ（RN Yoga の浮動小数点誤差・SafeArea 伸縮）を一切検出しない。

### FR-02：GAM SDK 内部幅キャッシュのクリア（センターずれ解消）
- BannerComp mount 直前に width に渡す値は、**必ず `横幅 50px 単位の丸め処理 + 符号付き Salt（= Math.floor(Date.now() / 1000) % 17 - 8）を ±8px の範囲で付与** した値を使用し、GAM SDK 内部の ANCHORED_ADAPTIVE width-cache fingerprint を毎回変える。
- 親 View の Banner ラッパーは、`alignItems: 'stretch'` を明示し、`width: '100%'` + `alignSelf: 'stretch'` で子 Banner を親幅一杯に強制的に広げ、`width` prop は「最小ベースライン」の意味だけに使用する。

### FR-03：初期化シーケンスの完全直列化（0.1 秒フラッシュ消え根絶）
初期 mount シーケンスは非同期 Promise チェーンで下記順序を 100% 守る：
1. `onLayout` → `containerWidth/Height` 確定（数値が有効な正数）
2. 300ms settle delay 挟む（Yoga 再計算による 2 回目 onLayout の fire を待つ）
3. 8 秒 cooldown を確認 → 問題なければ `reloadKey++`
4. BannerComp が mount されて request
5. onAdLoaded 発火で成功
→ 上記順序を守る限り、0.1 秒フラッシュ表示 → 即 unmount という事象は原理的に起こり得ない。

### FR-04：死活監視は断続的な Polling ではなく State Machine で管理
Heartbeat / Periodic / DEAD 等の複数の setInterval を削除し、**1 つの Timer のみを使用して下記 5 状態を持つ有限状態機械 (FSM)** に置き換える：
```
IDLE → WAIT_LAYOUT → WAIT_SETTLE → REQUESTING → LOADED → (error → WAIT_RETRY)
                                                   ↓(20分経過 or フォアグラウンド復帰 or Split View変化)
                                              WAIT_LAYOUT ←
```
- LOADED 中に 20 分経過、フォアグラウンド復帰、Split View 変化（閾値 20% 以上のサイズ差）時のみ WAIT_LAYOUT に遷移して作り直し。
- WAIT_RETRY：指数バックオフ（1,2,4,8,15,30 秒最大 6 回、その後 2 分固定）で WAIT_SETTLE に戻す。

### FR-05：Rate Limit 発生時の Escape Route
もし AdMob Server が Rate Limit（no-fill code = 3 or network error = 2）を 3 回連続で返した場合：
- `requestNonPersonalizedAdsOnly=true` に一時的にスイッチ（30 分間）してリクエスト fingerprint を変更
- BannerAdSize を、ANCHORED_ADAPTIVE_BANNER → ADAPTIVE_BANNER → FULL_BANNER → BANNER の順に 10 分毎にローテーション
- 30 分経過で元の設定に自動復帰

## 5. 非機能要件 (Non-Functional Requirements)
### NFR-01：パフォーマンス
- 画面起動から Banner onAdLoaded 発火までの平均時間を、1.0.5 版と比較して 10% 以上遅延させてはならない。
- State 更新回数を、1.0.6 版の 10% 以下に削減する。

### NFR-02：センタリング精度
- どの iOS デバイス・向き・Split View 割合でも、描画された Banner の左右の空白差は最大 1px 以内（ピクセルパーフェクトセンタリング）とする。

### NFR-03：安定性
- iPad 5・iPad A16・iPhone 12 の 3 機種で、3 時間の Slideshow 連続稼働中に Banner の非表示時間が合計 60 秒を超えてはならない（= 99.4% 以上の可視率）。

## 6. 制約・前提
- Expo SDK 54 / react-native-google-mobile-ads 15.8.3 固定（バージョンアップ不可）。
- iOS 16.7 (iPad 5) 〜 iOS 18 (A16) をサポート範囲。
- AdMob の配信ロジック自体には介入できない。
- Rate Limit の連続 3 回以上は AdMob の IP BAN 仕様とし、30 分間は同 fingerprint request を禁止する。

## 7. Acceptance Criteria
### rule AC-01：自己破壊ループ検出
`adDebug=true` 起動時、コンソールログで **1 分間の reloadKey++ 実行回数が常に <= 6 であることを、コードレビューで確認**。

### rule AC-02：0.1 秒フラッシュ消え
iPad 5 で Settings モーダルを 10 回連続 open/close を 3 セット実施し、**Banner が一瞬だけ表示されて消える事象が 30 回の試行で 0 回**。

### rule AC-03：センタリング精度
iPhone 横画面 (landscape 844×390) でバナーを表示したスクリーンショットを取得し、**左右の空白のピクセル差を計測して <= 1px**。

### rubric AC-04：長時間安定性（評価 0-3、閾値 >= 2）
iPad A16 で 3 時間 Slideshow 起動後に取得した動画・スクリーンショット証拠：
- 3 = Banner が完全に途切れず、バナーローテーションが通常通り発生
- 2 = 最大 1 回 30 秒以内の非表示あり、自動復旧
- 1 = 2 回以上の 30 秒以上の非表示
- 0 = 事象悪化・Banner が 20 分以上表示されない時間あり

### rule AC-05：GetDiagnostics 0 件
`GetDiagnostics` 実行で 0 files 0 diagnostics となること。
