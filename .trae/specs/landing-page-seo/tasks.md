# SimplePhotoFrame 紹介 LP - Implementation Plan

## 実装方針
- 静的資産は `site/` フォルダに配置する
- ページ構成：
  - 各言語ルート：`site/<lang>/index.html`（index: トップ）
  - 静的ページ：`site/<lang>/privacy.html`, `site/<lang>/terms.html`, `site/<lang>/support.html`
  - `lang` ∈ {ja, en, es, zh-Hans}
  - `x-default` として `site/index.html` を置き、en へリダイレクト（`<meta http-equiv="refresh">` + canonical で言い切る）
- 共通 CSS: `site/assets/css/styles.css`
- 共通 JS（言語切替・シェアボタン等、任意）: `site/assets/js/main.js`
- 共通画像（アイコン・OGP 画像・SVG ダミースクショ）: `site/assets/img/`
- robots.txt: `site/robots.txt`
- sitemap.xml: `site/sitemap.xml`
- Vercel 設定（オプション）：必要に応じて `site/vercel.json` またはルートに `vercel.json` を追加（SPA ではないので不要の可能性大）

---

## Task 1: サイト共通ファイル（フォルダ構成・CSS・JS・assets）を作成する
- **Status**: `pending`
- **Priority**: `high`
- **Depends On**: `None`
- **Description**:
  - `site/` フォルダと `site/assets/css`, `site/assets/js`, `site/assets/img`, `site/ja`, `site/en`, `site/es`, `site/zh-Hans` を作成
  - `styles.css` にてモバイルファースト・レスポンシブデザイン、コンテンツ最大幅 1120px、カラー（アプリ風のオーシャンブルー系、またはホワイト/ダーク切替なしのシンプル系）、カラーコントラスト 4.5:1 以上を確保
  - `main.js` は最小構成：言語切替 UI の click ハンドラ（デフォルトは静的 a タグで動くので JS なしでも動作する）
  - OGP 用のプレースホルダー画像（SVGまたはPNG）を用意。alt は常に設定
- **Acceptance Criteria Addressed**: AC-1, AC-6, AC-8, AC-10
- **Test Requirements**:
  - `rule` TR-1.1: フォルダ一覧コマンドで 4 言語 × 4 ページ用のフォルダ・CSS/JS/assets のフォルダがすべて存在することを確認する。Evidence: `ls` 系コマンドの標準出力
  - `rule` TR-1.2: `styles.css` を先頭から読み、メディアクエリ（@media）が 1 つ以上存在し、カラー指定のコントラストを簡易的に確認（背景 #fff 〜 #fafafa 付近、前景 #111 〜 #1a1a1a 付近で ratio 4.5:1 を満たす見込みがあること）。Evidence: CSS ファイル内容の一部切り出し
  - `rubric` TR-1.3: デザインの一貫性・見やすさ；scale 1-5；anchors 1=スタイルなしのむき出しHTML、3=普通のLP、5=よくできたスタートアップLP並の読みやすさ；threshold >= 4；Evidence: 目視確認のスナップショット相当の記述
  - `rule` TR-1.4: styles.css 内に `.section-concept-sustainable` または同等の Concept ① / Concept ② の専用セクション CSS クラスが存在し、視覚的にメリハリが付けられている（例: 薄い緑/ネイビー背景、アイコンスタイル等）。Evidence: CSS の該当クラス定義の抜粋
- **Notes**: アセットは未生成状態でも可。スクショはあとから差替可能な構造にする。

## Task 2: 4 言語 × 4 ページ（計 16 ファイル）の HTML を書き出す
- **Status**: `pending`
- **Priority**: `high`
- **Depends On**: `Task 1`
- **Description**:
  - 各言語で下記 4 ページを作成
    - index.html（トップ LP）：
      - 1. 言語切替ヘッダー
      - 2. Hero（アプリ名＋キャッチコピーはコンセプト①②に沿ったもの＋CTA）
      - 3. Problem / Challenges（3〜4 項目）
      - 4. Concept ① Sustainable 専用セクション（まだ動く端末を捨てない・電子ゴミ削減を強調しすぎず自然に）
      - 5. Concept ② Reuse in Daily Life 専用セクション（具体的な活用場面を Use case 4〜6 個）
      - 6. Features（時計/サイズ/マットカラー8種/インターバル秒分/広告モデル/4言語/写真ローカル処理のみ）
      - 7. How to use（3 ステップで古い端末にインストール→写真選び→飾る）
      - 8. Settings details
      - 9. Supported languages
      - 10. Privacy & Local processing
      - 11. FAQ（最低 8 項目以上。うち 3 項目以上はコンセプト①②に直接関連：古い端末の速度、対応OSバージョン、電子ゴミとの関係、家族へのプレゼント例、写真の安全性など）
      - 12. 最後の CTA セクション（コンセプト再掲）
      - 13. Footer
    - privacy.html：プライバシーポリシー（既存 docs/privacy を元に多言語化、最終更新日を追加）
    - terms.html：利用規約（既存 docs/terms を元に多言語化）
    - support.html：サポートページ（問合わせ先をプレースホルダ、よくある質問の短い一覧、App Store レビューへの誘導文言などを記載）
  - HTML はすべてセマンティック：`<!DOCTYPE html><html lang="ja"><head>...<body><header><main>...<section><article>...<footer>` の形。H1 は 1 ページ 1 つ。
  - `<head>` 共通項目：
    - charset, viewport
    - `<title>`, `<meta name="description">`：title と description の両方に、各言語版で「古い端末活用 / Sustainable / フォトフレーム / スライドショー / 時計表示」のいずれかのキーワードを自然に埋め込む
    - `<meta property="og:..."`, `<meta name="twitter:card" content="summary_large_image">` などの OGP/Twitter Card
    - `<link rel="canonical">`
    - `<link rel="alternate" hreflang="ja">` × 4 言語 + x-default（URL は公開 URL のプレースホルダでも一旦可。相対パス不可のため、`https://example.invalid/...` などから開始し、Vercel デプロイ後に置換できる変数管理か、後述 Task 4 で一括差替）
    - JSON-LD 埋め込み（トップページは SoftwareApplication + FAQPage、その他は Article または BreadcrumbList）。特に SoftwareApplication の `description` と `keywords` フィールドに、「old iPad reuse」「サステナブル」「余ったデバイス」などを自然な形で埋め込む
  - 言語切替 UI をヘッダー右側に配置。各言語の同ページへ遷移（例: 今が ja/privacy なら他言語の privacy へ飛ぶ）
  - Breadcrumb 構造化は任意だが、ページ内にパンくずリスト（Home > Privacy Policy）を配置
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-4, AC-6, AC-7, AC-8, AC-10
- **Test Requirements**:
  - `rule` TR-2.1: `find site -name "*.html" | wc -l` が 16 以上になる（x-default 用の site/index.html 追加で 17 可）。Evidence: `find` コマンド出力
  - `rule` TR-2.2: 各 HTML ページの `<h1>` が 1 つだけ存在し、かつ当該言語文字列であること。4 言語 × 代表ページ 2 種（index, privacy）の計 8 ページについて grep で H1 数を確認。Evidence: grep -c 結果の一覧
  - `rule` TR-2.3: トップページ（en）から `<script type="application/ld+json">` を取り出し、JSON.parse で構文エラーなし。かつ SoftwareApplication の `@type`, `name`, `offers`, `description`, `keywords` の 5 キーが存在。Evidence: Node ワンライナーまたは同等によるパース結果
  - `rule` TR-2.4: トップページ en の alternate hreflang の本数が 5（ja, en, es, zh-Hans, x-default）であること。Evidence: grep カウント
  - `rule` TR-2.5: 4 言語のトップページすべてに、App Store へのボタン要素（`<a ...>` + 文字列 "App Store" / 各言語名）が存在する。Evidence: 各ページの grep 結果
  - `rule` TR-2.6: ja/privacy.html 内に「アップロードしない」または相当の英文・他言語文のいずれかが、元のアプリ内文言と一致している。Evidence: 当該行の grep 出力
  - `rule` TR-2.8: 日本語トップページ ja/index.html にて、以下のセクション見出し（H2/H3）がそれぞれ 1 つ以上存在することを確認：
    - コンセプト①に関連（「サスティナブル」「持続可能」「電子ゴミ」「古い端末」のいずれかを含む H2/H3）
    - コンセプト②に関連（「活用」「再利用」「リビング」「キッチン」「祖父母」「使わない端末」のいずれかを含む H2/H3、または Use cases として 4 つ以上の事例項目が存在）
    - FAQ が 8 項目以上存在し、そのうち 3 項目以上が「古い端末」「電子ゴミ」「サスティナブル」「環境」「iPad 世代」「対応バージョン」いずれかのキーワードを含む
    Evidence: 上記それぞれの grep -c 結果一覧
  - `rubric` TR-2.7: 掲載機能の正確性；scale 1-5；anchors 1=嘘だらけ、3=一部不足、5=実機能と完全一致；threshold >= 4；Evidence: features セクション一覧と App.js の settings キー一覧の照合
  - `rubric` TR-2.9: コンセプト①②の表出度；scale 1-5；anchors 1=どちらも無し、3=どちらか一方のみ Hero + Features にチラ見せ、5=Hero+Problem+Concept①セクション+Concept②セクション+Features+FAQ3項目以上+最後のCTA再掲、計6箇所以上で表出＋Use cases4件以上；threshold >= 4；Evidence: 日本語と英語ページの各セクションでキーワードヒット数をまとめた表
- **Notes**: JSON-LD の `operatingSystem` は現状 iOS を確定とし、Android は "unspecified/未対応" として記載または Android 行は削除。App Store リンクは `https://apps.apple.com/app/idXXXXXXXXXX` のプレースホルダで良い。FAQ の具体的な項目としては以下のようなものを想定：
  - Q1. どのくらい古い iPad / iPhone まで使えますか？（対応OSバージョン iOS 15.1+ と記載）
  - Q2. 古い端末だと動作が重くなりますか？
  - Q3. 選んだ写真はどこかにアップロードされますか？
  - Q4. なぜ「古い端末を使い続ける」ことを推奨しているのですか？（サステナブル関連）
  - Q5. このアプリは完全無料ですか？（広告モデル説明）
  - Q6. オフラインでも動きますか？
  - Q7. 祖父母にプレゼントする使い方はできますか？（活用場面）
  - Q8. マットカラーは何種類ありますか？

## Task 3: robots.txt と sitemap.xml を生成する
- **Status**: `pending`
- **Priority**: `high`
- **Depends On**: `Task 2`
- **Description**:
  - `site/robots.txt`：
    - `User-agent: *` → `Allow: /`
    - 明示的に主要 AI crawler を許可する行を追加（GPTBot, Google-Extended, ClaudeBot, PerplexityBot 等；ユーザーが拒否したい時にコメントアウトできる形）
    - `Sitemap: <公開URL>/sitemap.xml` （公開 URL はプレースホルダ可、後で Task 4 で差替）
  - `site/sitemap.xml`：
    - 4 言語 × 4 ページ の 16 URL 以上（x-default のトップも追加で 17 可）
    - 各 `<url>` 内に `<xhtml:link rel="alternate" hreflang="..." href="..."/>` で 4 言語 + x-default を列挙（または省略可。SEO 強めるなら列挙）
    - `<lastmod>` は現在日付（YYYY-MM-DD）
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `rule` TR-3.1: sitemap.xml を XML パーサ（Node）でエラーなくパースでき、`<url>` 要素が 16 個以上存在。Evidence: パース結果の url 個数
  - `rule` TR-3.2: robots.txt に `Sitemap:` 行が存在し、`User-agent: *` に対して `Disallow: /` でない（Allow または空な Disallow のみ）。Evidence: robots.txt の全文出力
  - `rubric` TR-3.3: Sitemap 網羅度；scale 1-5；anchors 1=URL 数半分未満、3=主要ページ網羅、5=全ページ＋hreflang も併記；threshold >= 4；Evidence: sitemap 中身のレビュー
- **Notes**: sitemap の URL はいったんプレースホルダ（https://simplephotoframe.example/）を root として記述。Task 4 で実 URL に置換可能な形にしておく。

## Task 4: （任意ステップ）App Store リンク・サポート連絡先・公開 URL を差し替える（現時点では空実装可）
- **Status**: `pending`
- **Priority**: `medium`
- **Depends On**: `Task 3`
- **Description**:
  - ユーザーから App Store リンク・メールアドレス・公開 URL（Vercel URL）をヒアリング後、一括置換
  - 全 HTML / sitemap.xml / robots.txt / canonical / OGP URL の差替
  - 今回の承認時点では未設定でも OK とする（Task として切り分け、後で実行できるように残しておく）
- **Acceptance Criteria Addressed**: AC-9 補完
- **Test Requirements**:
  - `rule` TR-4.1: （実行時のみ）example.invalid / example.com がページソースに残っていないことを grep で確認。Evidence: 一致 0 件の結果
  - `rule` TR-4.2: App Store ID が仮の XXXXXXXX のままになっていない（本物の ID で grep できる）。Evidence: grep 出力
- **Notes**: 本 task は承認時点では pending のまま保留し、デプロイ後に実施しても良い。

## Task 5: Lighthouse（または同等）による SEO/A11y/Performance 検証と修正
- **Status**: `pending`
- **Priority**: `high`
- **Depends On**: `Task 2, Task 3`
- **Description**:
  - `npx serve site` または `python -m http.server` でローカル起動し、Lighthouse または代替で以下確認
    - 代表ページとして en/index.html を Desktop モードで計測
    - SEO 95 以上、A11y 90 以上、Performance 90 以上を目指す
  - 未達の場合は下記改善を行う：
    - 画像に alt がなければ付ける
    - title/description の長さ適正化
    - meta viewport / lang 属性の確認
    - CSS の render block / 不要な JS 除去
    - カラーコントラストの調整
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `rule` TR-5.1: Lighthouse が実行可能である場合、そのレポート JSON を保存し、3 カテゴリのスコアを抽出。Evidence: `cat report.json | jq .categories.*.score` 相当の出力
  - `rubric` TR-5.2: 実行環境問題（ネットワーク/メモリ）で Lighthouse が実行不可な場合、手動チェック：title/description/OGP/hreflang/JSON-LD/alt/viewport/lang の 8 項目を目視確認。1 項目 1 点で 8 点中 8 点＝満点。scale 1-5；anchors 1=4 点以下、3=6 点、5=8 点；threshold >= 4；Evidence: 8 項目に対するチェック表
- **Notes**: Lighthouse が npm キャッシュなどで重い場合は `npx --yes lighthouse` を使用、または手動チェック TR-5.2 で代替。

## Task 6: Vercel へデプロイ（TRAE の deploy_to_remote 使用）
- **Status**: `pending`
- **Priority**: `high`
- **Depends On**: `Task 5`
- **Description**:
  - 必要に応じてプロジェクトルートに `vercel.json`（public を `site`、または site ディレクトリを Project Root にする設定など）を作成
  - TRAE の `deploy_to_remote` ツールの `vercel` オプションでデプロイを試行
  - デプロイが完了したら、公開 URL を記録し、Task 4 の実行可否を判定
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `rule` TR-6.1: デプロイが成功し、vercel.app の URL（またはカスタムドメイン）で 200 OK が返る。Evidence: deploy_to_remote の出力 + curl -I のレスポンス
  - `rule` TR-6.2: 公開 URL の en/index.html に対して title タグが正しく取得できる。Evidence: curl で先頭部分を抜き出した結果
  - `rubric` TR-6.3: デプロイの再現性；scale 1-5；anchors 1=手動複数コマンド、3=vercel.json あり、5=1 アクションで再デプロイ可能；threshold >= 3；Evidence: 実行手順書または vercel.json の存在確認
- **Notes**: Vercel CLI 未ログインなどで deploy_to_remote が失敗する場合、Task 6 を一旦 blocked にして状況を共有。

---

## Task 依存関係まとめ
- Task 1 → Task 2 → Task 3 → Task 5 → Task 6
- Task 4 は Task 3 完了後〜Task 6 前後の任意タイミング（ユーザーから情報提供後に実施）
