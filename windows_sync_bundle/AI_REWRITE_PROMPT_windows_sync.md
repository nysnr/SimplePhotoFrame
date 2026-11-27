# Windows側反映用 AI プロンプト

このファイルは、`SimplePhotoFrame-pre-release 改修前/` を参照元として、現在フォルダで確認済みの変更を Windows 側の作業環境へ安全に反映するためのプロンプトです。

## 使い方

1. Windows 側で、Git 管理されているプロジェクトルートを開く
2. AI コーディング支援（Trae / Cursor / Copilot Chat など）に以下のプロンプトを貼る
3. プロンプト内の「参照元ファイル」と「書換対象ファイル」を同じプロジェクト内で参照させる
4. 反映後に `npm install` を実行する

## 半自動スクリプト

AI に貼る代わりに、プロジェクト内の半自動スクリプトを使うこともできます。

```bash
npm run sync:windows-fixes
npm install
```

バックアップを作ってから適用したい場合:

```bash
npm run sync:windows-fixes:safe
npm install
```

変更予定だけ確認したい場合:

```bash
npm run sync:windows-fixes:dry-run
```

最新バックアップから戻したい場合:

```bash
npm run sync:windows-fixes:restore
```

- スクリプト: [apply-windows-sync.js](file:///Users/aine/workspace/SimplePhotoFrame-pre-release/scripts/apply-windows-sync.js)
- 復元スクリプト: [restore-windows-sync.js](file:///Users/aine/workspace/SimplePhotoFrame-pre-release/scripts/restore-windows-sync.js)
- 安全版は変更前ファイルを `_sync_backups/<timestamp>/` に保存します
- 対象ファイル:
  - `App.js`
  - `app.config.js`
  - `config/adsConfig.js`
  - `components/ads/AdBanner.js`
  - `package.json`
- 参照元の `SimplePhotoFrame-pre-release 改修前/` は、手順確認用として残しておく想定です

## 貼り付け用プロンプト

```md
このプロジェクト内の `SimplePhotoFrame-pre-release 改修前/` を参照元として使い、現在のプロジェクトに対して次の変更を反映してください。

目的:
- ローカル Xcode Release 実行時の production 誤判定を避ける
- スライドショー中のみ画面のスリープ/ロックを抑止する
- バナー広告設定を安定化し、無効な広告ユニットIDはテスト用IDへフォールバックする
- バナー広告の表示・失敗時挙動を安定化する

絶対条件:
- `SimplePhotoFrame-pre-release 改修前/` は参照専用とし、編集しない
- 変更対象は以下のファイルのみに限定する
- 生成物や `ios/Pods`, `ios/build`, `.expo` は編集しない
- 既存のロジックは極力維持し、差分最小で変更する

変更対象ファイル:
- `App.js`
- `app.config.js`
- `config/adsConfig.js`
- `components/ads/AdBanner.js`
- `package.json`

参照方法:
- 各ファイルについて、同名の参照元を `SimplePhotoFrame-pre-release 改修前/` 配下から読み、その差分を現在ファイルへ反映する

ファイルごとの反映内容:

1. `App.js`
- `expo-keep-awake` から `activateKeepAwakeAsync`, `deactivateKeepAwake` を import する
- `showSlideshow` を監視する `useEffect` を追加する
- `showSlideshow === true` の間だけ keep awake を有効化し、終了時や cleanup で解除する

2. `app.config.js`
- `isProdBuild` を `env.EAS_BUILD_PROFILE === 'production'` のみで判定する
- `testBannerIds` に Adaptive Banner 用テストID
  - `ca-app-pub-3940256099942544/9214589741`
  - `ca-app-pub-3940256099942544/2435281174`
  を追加する

3. `config/adsConfig.js`
- `expo-constants` を import する
- `Constants.expoConfig.extra` などから `extra` を取得する
- `ENABLE_ADS` は `env.EXPO_PUBLIC_ENABLE_ADS ?? extra.enableAds ?? env.ENABLE_ADS ?? 'true'` で決定する
- `normalizeId()` を追加し、`null`, `undefined`, 空文字を除外する
- `isValidAdUnitId()` を追加し、`/^ca-app-pub-\d{16}\/\d{10}$/` で形式チェックする
- `BANNER_AD_UNIT_ID` は
  - 開発時は iOS/Android の Banner テストIDを返す
  - 本番/通常時は `env.EXPO_PUBLIC_BANNER_AD_UNIT_ID ?? extra.bannerAdUnitId ?? env.BANNER_AD_UNIT_ID` を使う
  - 値が無い、または形式不正ならテストIDへフォールバックする

4. `components/ads/AdBanner.js`
- テスト用ユニットID集合 `TEST_BANNER_IDS` を追加する
- `adLoaded`, `lastError` の state を追加する
- `placeholderText` を拡張し、初期化中 / モジュール未ロード / リトライ中 / loaded の文言を出せるようにする
- Web / Expo Go の場合はプレースホルダー表示を返す
- `handleFail(error)` を実装し、エラー内容を `lastError` に入れ、`console.log` に詳細を出す
- `mapSize()` を拡張し、テストIDに応じて
  - 通常 Banner テストIDなら `BannerAdSize.BANNER`
  - Adaptive テストIDなら `BannerAdSize.ANCHORED_ADAPTIVE_BANNER`
  を返す
- `showPlaceholder = !adLoaded` とする
- `canRenderAd` を導入し、必要条件が揃ったときだけ広告を描画する
- `onAdLoaded` で `adLoaded = true`, `lastError = ''`
- `onAdFailedToLoad` で `handleFail(error)`
- 画面上の `unitId=...` や `size=...` のデバッグ表示は入れない

5. `package.json`
- dependencies に `"expo-keep-awake": "~15.0.7"` を追加する
- `postinstall` に `&& patch-package` を追加する

確認事項:
- 変更後に `npm install` を実行する
- `package-lock.json` は必要に応じて更新する
- 変更後、差分の要約を出力する
- 可能なら lint / diagnostics を確認する
```

## 参照元と書換対象の対応

- 参照元: `SimplePhotoFrame-pre-release 改修前/App.js`
  - 書換対象: `App.js`
- 参照元: `SimplePhotoFrame-pre-release 改修前/app.config.js`
  - 書換対象: `app.config.js`
- 参照元: `SimplePhotoFrame-pre-release 改修前/config/adsConfig.js`
  - 書換対象: `config/adsConfig.js`
- 参照元: `SimplePhotoFrame-pre-release 改修前/components/ads/AdBanner.js`
  - 書換対象: `components/ads/AdBanner.js`
- 参照元: `SimplePhotoFrame-pre-release 改修前/package.json`
  - 書換対象: `package.json`

## 補足

- `package-lock.json` は今回の比較では差分なしでしたが、Windows 側で `npm install` を行うと更新される可能性があります
- `ios/` 以下の変更は Windows 側では直接反映せず、必要なら Mac 側で再生成・確認してください
- 本番リリース前には、テスト用広告IDではなく本番の広告ユニットIDへ差し替えてください
