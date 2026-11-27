# 収益化最適化 実装プラン

## 現状の課題（リポジトリ調査結果）

現在の広告実装（[AdBanner.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js)）と設定（[app.config.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/app.config.js)）を調査した結果、収益を抑制している要因は以下の通り：

### 1. アプリ側での強制更新タイマー（heartbeat）が稼働中
- [AdBanner.js#L64-L86](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js#L64-L86) の `startHeartbeat` で `setInterval` により iPhone=60秒、iPad=15分ごとに `ref.load()` を強制呼び出している
- Google 推奨に反する：SDKの自動更新を妨げ、レートリミット・無効トラフィック判定リスクがある

### 2. 固定サイズバナーを使用（アダプティブではない）
- [AdBanner.js#L26-L28](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js#L26-L28) で iPad=`leaderboard`、iPhone=`banner` の固定サイズ
- 特に iPad の LEADERBOARD(728x90) は在庫が少なく、深夜帯などに枯渇（No Fill）が発生しやすい

### 3. 自動スリープ防止未設定
- `idleTimerDisabled` の設定がどこにもない（Grep でヒットなし）
- 24時間連続運用時に画面がスリープし、広告impが途切れる

### 4. インタースティシャル広告未実装
- [InterstitialManager.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/InterstitialManager.js) はスキャフォールド状態（`isEnabled()` が常に false）
- ただし [App.js#L1124](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/App.js#L1124) で既に `showIfReady` の呼び出しコードは埋め込み済み

### 5. メディエーション未設定
- AdMob 単体運用のため、在庫枯渇時のバックアップがない
- これはコード改修ではなく AdMob 管理画面での作業が必要

### 6. 不適切広告フィルタリングは部分的に設定済み
- [app.config.js#L80](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/app.config.js#L80) で `maxAdContentRating: 'PG'` 設定済み（良い）
- ただし AdMob 管理画面側の「ブロックのコントロール」でのカテゴリブロックは未設定の可能性が高い

---

## 実装ステップ（依存順）

### Phase 1: コード改修（私が完結可能な作業）

#### Step 1: アプリ側強制更新タイマーの削除 ＋ バックグラウンド時リクエスト停止
**変更ファイル: [AdBanner.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js)**
- `startHeartbeat` / `stopHeartbeat` 関数と関連 state/effect を削除
- `heartbeatIntervalMs` props も不要になるため削除
- SDK の自動更新（`optimizeAdLoading: true` は [app.config.js#L77](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/app.config.js#L77) で設定済み）に任せる
- フォアグラウンド復帰時・レイアウト変更時のリロードは保持（[AdBanner.js#L245-L262](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js#L245-L262) は残す）
- **バックグラウンド移行時のリクエスト停止**: GADBannerView の標準挙動に依存し、アプリ側からはバックグラウンド時に `ref.load()` を呼ばないことを徹底（heartbeat 削除で自動的に満たされる）。AppState リスナーは `active` 時のみリロードする既存実装を維持

#### Step 2: アダプティブバナーへの移行（案B）
**変更ファイル: [AdBanner.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js)**
- デフォルトサイズを `leaderboard`/`banner` から `adaptive`（`ANCHORED_ADAPTIVE_BANNER`）に変更
- **iPad でもアダプティブをデフォルトにする**（在庫拡大、枯渇防止）
- 既存の固定サイズ対応は残しつつ、デフォルトを adaptive に

#### Step 3: 自動スリープ防止の追加（24時間運用対応）
**変更ファイル: [App.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/App.js)**
- スライドショー開始時に `idleTimerDisabled = true` を設定（`NativeModules.DeviceIdleManager` または React Native 標準API経由）
- スライドショー終了時に `false` に戻す
- 新規依存関係を追加する場合は `expo-keep-awake` を検討（既存依存関係を優先確認）

#### Step 4: インタースティシャル広告の実装
**変更ファイル: [InterstitialManager.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/InterstitialManager.js)
- `InterstitialAd` を使用した実装
- プリロード、表示間隔制御（3〜5分クールダウン、1日2〜3回キャップ）
- [App.js#L1124](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/App.js#L1124) の呼び出しコードは既存のまま活用

#### Step 5: requestOptions の最適化
**変更ファイル: [AdBanner.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js)
- 現在 `requestNonPersonalizedAdsOnly: false`（ATT許可時はパーソナライズ有効で正しい
- ATT不許可時は `true` に切り替えるロジックを追加（コンプライアンス向上）

---

### Phase 2: ユーザー作業が必要な事項（私は待機）

#### Step 6: AdMob 管理画面でのメディエーション設定
**ユーザー作業:**
- AdMob 管理画面 → 「メディエーション」 → メディエーショングループ作成
- バナー広告ユニット（`7061250916）に対して AppLovin / Meta Audience Network などを連携
- インタースティシャル広告ユニット（`8520494517）にも同様に連携

#### Step 7: AdMob 管理画面でのブロック設定
**ユーザー作業:**
- AdMob 管理画面 → 「ブロックのコントロール」 → 「デリケートなカテゴリ」
- 出会い系、性的表現、ギャンブル、暴力などをブロック
- 「一般カテゴリ」でも不適切なジャンルをブロック
- 必要に応じて「広告レビューセンター」で個別ブロック

#### Step 8: AdMob 管理画面での更新頻度設定
**ユーザー作業:**
- 各広告ユニットの「詳細設定」 → 更新頻度を「Google最適化」に設定
- （アプリ側タイマー削除後、SDK の自動更新に任せる）

---

## 検証方法

1. **ローカルビルドでの動作確認**:
   - `npx expo start --dev-client` で起動
   - スライドショー中に広告が表示されること（アダプティブバナー）
   - 画面がスリープしないこと（`idleTimerDisabled` 確認）
   - アプリをバックグラウンドに移行した際、広告の自動リロードが停止すること
   - フォアグラウンド復帰時に広告が再ロードされること
   - 設定画面を閉じた際にインタースティシャルが表示されること（クールダウン後）

2. **AdMob 管理画面での確認（ユーザー作業後）:
   - メディエーションの設定後、レポートで各ネットワークの表示率を確認

3. **TestFlight ビルドでの実機検証:
   - EAS Build でビルド後、TestFlight で実機確認

---

## リスクと対処

| リスク | 対処 |
|---|---|
| アダプティブバナー移行でレイアウトが崩れる | `onHeightChange` で高さを動的に取得して調整（既存ロジックあり） |
| インタースティシャルが頻出してUX悪化 | クールダウン3〜5分・1日3回キャップで抑制 |
| メディエーション設定ミスで広告が表示されない | 設定後に AdMob テストモードで確認（ユーザー作業後に私がコード側で確認可能 |
| idleTimerDisabled でバッテリー消費 | スライドショー中のみ有効化、終了時に解除 |

---

## トークンコスト見積もり

実装に必要なトークン消費の見積もり：

| 作業 | 推定トークン数 |
|---|---|
| プラン策定（本書） | 約 3,000 |
| Step 1: heartbeat タイマー削除 | 約 2,000 |
| Step 2: アダプティブバナー化 | 約 3,000 |
| Step 3: スリープ防止追加 | 約 1,500 |
| Step 4: インタースティシャル実装 | 約 5,000 |
| Step 5: requestOptions 最適化 | 約 1,000 |
| 検証・デバッグ・修正 | 約 5,000 |
| **合計** | **約 20,500 トークン |

$3 のトークン予算に対して、約 20,500 トークン（モデルによりますが、多くの場合 $0.10 相当）で完結可能です。**$3 を大幅に下回る見込みです。

（注：トークン単価はモデルにより異なりますが、2万トークン程度であれば $3 の予算内で確実に収まります。
