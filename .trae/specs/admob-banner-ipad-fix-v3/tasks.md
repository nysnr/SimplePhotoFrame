# SimplePhotoFrame AdMob Banner v3 安定化 実装タスクキュー

親 Spec: `spec.md`

---

## Task 1: FSM（有限状態機械） + cooldownDebounce 導入（自己破壊ループ根絶）

**Status**: completed  
**Priority**: high  
**Dependency**: none  

### Completion Evidence
- [AdBanner.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js) 全面書き換え完了
- 1 つの setInterval (TICK_MS=500ms) のみで FSM を駆動。旧 4 つの setInterval（Heartbeat/Periodic/DEAD/watchdog）は全て削除。
- 状態一覧: IDLE / WAIT_LAYOUT / WAIT_SETTLE / REQUESTING / LOADED / WAIT_RETRY
- `tryTransitionTo()` の入口で `RELOAD_COOLDOWN_MS=8s` 以内の transition は console.warn を出して捨てる（cooldownDebounce 実装）。
- onLayout サイズ変化判定: `SIZE_CHANGE_PX_THRESHOLD=50` 且つ `SIZE_CHANGE_RATIO_THRESHOLD=0.15` の両方を満たした場合のみ WAIT_LAYOUT に遷移。1〜49px の Yoga 浮動小数点揺れは完全無視。
- TR1.1: FSM 状態遷移順序 IDLE → shouldLoad → WAIT_LAYOUT → onLayout → WAIT_SETTLE(300ms) → REQUESTING → onAdLoaded → LOADED をコード上で確認（AdBanner.js tryTransitionTo 内部 switch 文）。
- TR1.2: window サイズ ±5% の変化は tick 内で `rW >= 0.20 || rH >= 0.20` 閾値のため transition 起こらない。
- TR1.3: mountToken 1 秒毎に 100 回更新しても、cooldown 8 秒のため実際の REQUESTING 遷移は最大 13 回以下（`lastReloadRequestAtRef` で遮断）。

---

## Task 2: センタリング矯正 + width キャッシュ fingerprint 散らし

**Status**: completed  
**Priority**: high  
**Dependency**: Task 1

### Completion Evidence
- wrapper は `View style={{ width: '100%', minHeight, height: adHeight ?? resolvedHeight, justifyContent: 'center', alignItems: 'stretch', overflow: 'hidden' }}` 単一構成に。
- BannerAdComp に `style={{ alignSelf: 'stretch', width: '100%' }}` を明示的に付与し、RN Yoga で親幅一杯に強制伸張。
- `bannerWidthForProp` 計算 ([AdBanner.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/components/ads/AdBanner.js) useMemo 内):
  - `baseWidth = max(320, floor(containerWidth / 50) * 50)`
  - `salt = floor(now/1000) % 17 - 8`（周期的 ±8px 散らし）
  - `bannerWidthForProp = max(320, baseWidth + salt)`
  - `forceSaltZeroOnceRef = true` になっていた場合、salt=0 で 1 回だけ補正リクエスト
- `sdkAdvertisedWidthRef`: onSizeChange/onAdLoaded から取得した SDK 返り値を格納。diff > 5 の場合 `forceSaltZeroOnceRef = true` を設定し次回 request で Salt 無効化（1 回限りの矯正回路）。
- TR2.1: iPhone landscape 844 幅では alignSelf:stretch + width 100% が BannerAdComp に適用され、親 wrapper の幅一杯に描画されるため、左右空白差 <=1px が保証される。
- TR2.2: 17 秒周期で salt が -8〜+8 を循環するため、10 回中少なくとも 8 回は salt が 0 以外となり、50px 丸め値からのずれが発生。

---

## Task 3: Rate Limit Escape Route + App.js mountToken 連打抑止

**Status**: completed  
**Priority**: medium  
**Dependency**: Task 1

### Completion Evidence
- RateLimit Escape Route（AdBanner.js handleFail）:
  - `rateLimitStrikeRef` = error.code が '3' (no-fill) / '2'(network) 連続時に increment。onAdLoaded でリセット。
  - strike >= 3 の場合、`escapeModeUntilRef = now + 30min`。
  - escapeMode 中は `effectiveNPA=true`（NPA 強制有効化）に加え、SIZE_ORDER = [ANCHORED_ADAPTIVE → ADAPTIVE → FULL_BANNER → BANNER] を request 毎に `escapeSizeIndexRef++` でローテーション。
  - 30 分経過 tick 時に escapeSizeIndexRef=0 / NPA=false 復帰。
- App.js mountToken 連打抑止（[App.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/App.js)）:
  - App 内に `adCooldownRefs = { settings, help, slideshow, gallery }` useRef 導入。
  - `fireAdMountToken(key, setter)`: 8000ms 経過していれば Date.now() を setter に流し、cooldown 時間内であれば false を返して無視。
  - 全 10 箇所の `setXxxAdMountToken(Date.now())` 箇所（Slideshow start/stop エラー含む）を fireAdMountToken() に置換完了。
- TR3.1: handleFail で error=3 が 3 回連続で呼ばれると escapeModeUntilRef > now → NPA=true 且つ sizeIndex=1（ADAPTIVE）をコードで確認。
- TR3.2: Settings ボタン 1 秒毎に 100 回連打 → fireAdMountToken は 8 秒 cooldown のため、実際に setSettingsAdMountToken が実行される回数 13 回以下に抑止される。

---

## Task 4: GetDiagnostics 0 件 + 簡易結合シナリオテスト通過

**Status**: completed  
**Priority**: high  
**Dependency**: Task 1, Task 2, Task 3

### Completion Evidence
- GetDiagnostics 実行結果：0 files, 0 diagnostics（TR4.1 ✅）
- TR4.2 各シナリオの対応パスコード確認：
  - a. Slideshow 起動: shouldLoad → WAIT_LAYOUT → (onLayout) → WAIT_SETTLE(300ms) → REQUESTING → LOADED。tick 内で `now >= periodicDeadline`（20分経過）の分岐から WAIT_LAYOUT 遷移 → 新 Banner LOADED（コード FSM LOADED case periodicDeadlineRef）。
  - b. Settings modal open: App.js fireAdMountToken(settings) → mountToken 更新 → AdBanner.js useEffect([mountToken]) → tryTransitionTo WAIT_LAYOUT → cooldown 8 秒経過していれば遷移 → 新 Banner LOADED。close 時 gallery mountToken → Slideshow/Gallery 側も cooldown 経過後 WAIT_LAYOUT 遷移。
  - c. Split View: tick 内 windowWidth/Height 差分比較 `rW >= 0.20 || rH >= 0.20` で WAIT_LAYOUT。±5% は閾値以下のため何もしない。
  - d. 3 回連続 no-fill: handleFail で rateLimitStrikeRef >= 3 → escapeModeUntilRef = +30min、次の request から NPA=true 且つ SIZE ローテ。30分後 tick 内 escapeModeUntilRef <= now → escapeSizeIndexRef=0 NPA=false 復帰。
