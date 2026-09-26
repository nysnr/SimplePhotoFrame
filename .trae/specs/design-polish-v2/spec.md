# SimplePhotoFrame LP — Design Polish v2 Requirements Document (Spec Mode)

## Overview
- **Summary**: SimplePhotoFrame 多言語LP（`site/ja|en|es|zh-Hans/*.html` + `site/index.html`）の**HTML構造・CSSクラス体系を全言語で完全共通化**した上で、視覚デザインを洗練（スペーシング・タイポグラフィ・カラー・シャドウ・角丸・モーションの最適化）する。
- **Purpose**: ユーザーからの「デザインを洗練された感じにブラッシュアップ / 基本的にすべて同じデザインに」要求に応えると同時に、**SEO（Google検索ヒット）とAI引用を最優先**とするため、既存のSEO資産（metaタグ・JSON-LD・hreflang・コンテンツ本文・見出し構造）は一切変更せず、見た目だけをアップデートする。
- **Target Users**: 既存LPの到達ユーザー（日本/英語圏/スペイン語圏/中国語簡体字圏の一般消費者）＋ Googlebot / GPTBot / ClaudeBot などの検索・AIクローラ。

## Goals
1. **全言語共通の統一デザイン**: `ja/en/es/zh-Hans` 全16ページ（＋`index.html`）で**完全に同一のHTML骨格（header/main/13セクション/footer）・同一クラス名**を使用し、言語による表示崩れや見た目の差異をゼロにする。
2. **視覚的洗練**: モダンで高級感のある SaaS / プロダクトLP 標準的なデザイン（余白・行間・グリッドの厳格化、グラデーション・ノイズ・被写界深度風の背景、ボタンの高さと影の適正化、カードの浮遊感）を実装。
3. **SEO・AI引用最優先保証**: 既存の `<title>` / `meta description` / `meta keywords` / `canonical` / `hreflang` × 5本 / `og:*` / `twitter:*` / **JSON-LD（SoftwareApplication + FAQPage + BreadcrumbList）** / 本文コンテンツ / 見出し順序（H1→H2→H3） / alt属性・aria属性・lang属性 は**文字単位で一切変更しない**。
4. **A11y維持**: WCAG AA（コントラスト比4.5:1以上）を維持。現在の 16.8:1 を下回らない範囲でカラー調整。
5. **スマホ完璧**: 560px以下・960px以下ブレイクポイントで、タップターゲット 44px以上、CTAボタンは全幅、テキストは1行あたり35〜55字程度に収まるよう調整。

## Non-Goals
- **文言・テキスト内容の変更**: いかなる理由があっても、各HTMLの可読テキスト（`<h1>〜<p>〜<li>`内）・metaタグ内・JSON-LD内の文字列を**変更・追加・削除しない**（デザイン目的での文字修正厳禁）。
- **セクション順序の入替**: Hero → Problem → Concept① → Concept② → Features → Settings/Lang → Privacy/Local → FAQ → Testimonials/Why → Final CTA → Footer の順序固定。
- **新規画像アセットの追加**: `og.svg` 以外のファイルを `site/assets/img/` に追加しない。ビジュアルはCSSグラデーションとアイコン（絵文字またはCSSパーツ）で表現。
- **JavaScriptの肥大化**: `main.js` は既存のFAQスクロール連携（あれば）を維持。アニメーションは原則CSS（transition/animation）のみで実装。
- **外部フォント・アイコンCDN**: 読み込み速度とクローラブロック回避のため、Google Fonts / Font Awesome / Tailwind CDN 等は**一切使用しない**。既存の system font stack を継承。

## Background & Context
### 現状課題（Filesystem 証拠ベース）
1. **HTML構造の言語間不一致**:
   - `site/ja/index.html` は旧クラス体系: `<header><nav class="site-nav">`, `<section class="section-problem">`, `<div class="card-grid card-grid-4">`, `<div class="card card-problem">` などを使用。
   - `site/en/index.html` は styles.css の新クラスに**部分的**に追従: `<header class="site-header">`, `<div class="container">`, `<div class="grid grid-4">`, `<div class="card">` など混在。
   - その結果 `styles.css` の大半のクラスが実HTMLから参照されておらず、デザインが当たっていないページが存在する。
2. **CSS側とHTML側のクラス名不一致**:
   - styles.css: `.hero-grid / .hero-art / .hero-frame / .feature-grid / .usecases / .step / .matte-palette / .swatch / .langs / .lang-card / .privacy-box / .faq-list / details.faq` などの定義がある。
   - HTML(ja)では上記を全く使用せず、`.hero-mockup / .mockup-frame / .card-usecase / .steps-list / .color-palette / .palette-swatch / .two-col-box / .faq-list <details>` など旧命名。
   - HTML(en)では一部中間状態。
3. **未統合クラスの例**:
   - `.card .icon`, `.section-concept-sustainable .card.sus .icon` などは styles.css で定義済みだが、既存HTMLでは `<div class="card-icon">📱♻️</div>` という別クラスになっている。
   - `.breadcrumb` クラスと旧 `.breadcrumb-section` クラスが混在。
4. **視覚的課題**: （CSS定義は素晴らしいがHTMLが追いついていないため）一部ページではスペーシングが無く、カードの浮遊感や影も無く、CTAボタンのサイズが言語で異なる。

### 既存資産（死守すべきもの）
- `site/*/*.html` の `<head>` 内: title, meta description, keywords, canonical, hreflang 5本, og:*, twitter:* は完全維持。
- JSON-LD の全ブロック（SoftwareApplication, FAQPage, 一部BreadcrumbList）: 完全維持。
- 各セクションの見出しテキストと順序、FAQのQ&A文、privacy exact文言「本アプリは、お客様が選択した写真をサーバーにアップロードしません。」: 完全維持。
- 設定: `vercel.json` / Vercel GUI Override 3点 は変更しない。

## Functional Requirements
- **FR-1 全言語HTML クラス名統一**: `styles.css` で定義済みのクラス名（下記一覧）を、`ja/en/es/zh-Hans` の**4言語すべての `index/privacy/terms/support.html`**（計16ファイル）と `site/index.html` で、同一セマンティクス箇所は**完全に同一クラス名**で記述する。
  - 採用クラス体系原則: 既存 `styles.css` の `.site-header / .container / .breadcrumb / .hero / .hero-grid / .hero-kicker / .hero-art / .hero-frame / .section / .card-grid / .card / .icon / .sus / .reuse / problem / .feature-grid / .usecases / .usecase / .tag / .steps / .step / .settings-wrap / .setting-list / .matte-palette / .swatch / .langs / .lang-card / .badge / .privacy-box / .faq-list / details.faq / .final-cta / .final-cta-box / .site-footer / .footer-grid / .article` を**ベース**とする。
  - 旧HTMLのクラス (`site-nav / hero-inner / hero-mockup / section-problem / card-grid-4 / card-problem / card-icon / two-col-box / testimonials / testi-bullets / final-cta-inner / footer-inner / footer-links` 等) は**新クラス体系に置換**。
- **FR-2 13セクション構造厳守**: 4言語の index.html は全て下記構成を**完全同一のセマンティックHTML構造**で実装。
  1. `<header class="site-header">` (sticky blur)
  2. `<nav aria-label="Breadcrumb" class="breadcrumb">` (BreadcrumbList JSON-LDと対応)
  3. `<section class="hero">` (Hero ＋ CTA × 2 ＋ visual)
  4. `<section class="section section-problem">` (Problem カード × 4)
  5. `<section class="section section-concept-sustainable">` (Concept① ＋ bullets ＋ usecase ×4)
  6. `<section class="section section-concept-reuse">` (Concept② ＋ scenarios ×3 ＋ steps ×3)
  7. `<section class="section section-features">` (Features ×6)
  8. `<section class="section section-settings-lang">` (Settings ＋ matte palette 8色 ＋ lang ×4)
  9. `<section class="section section-privacy-local">` (Privacy ×2 ＋ exact 文言)
  10. `<section class="section section-faq">` (FAQ 8問, `<details class="faq">` で囲む)
  11. `<section class="section section-why">` (Why/Testimonials: 旧section-testimonialsをリネーム)
  12. `<section class="final-cta">` (最終CTA)
  13. `<footer class="site-footer">` (Footer 4カラム ＋ copyright)
- **FR-3 記事ページ (privacy/terms/support) 共通化**: 4言語の `privacy/terms/support.html` は全て同一構造・同一クラス (`<div class="container">` → `<nav class="breadcrumb">` → `<article class="article">`) を使用。
- **FR-4 リンクパス**: 内部リンクは `/` 始まりの絶対パスを使用（`/ja/index.html`, `/en/support.html` 等）。言語切替メニューは全ページで同一の 4言語＋x-default へのリンク。

## Non-Functional Requirements
- **NFR-1 デザイン品質（SaaS プロダクトLP 標準）**:
  - Vertical Rhythm: セクション間 `padding: 88px 0`（モバイル `64px`）、見出し下マージン 20〜28px、カード内間隔 24px。
  - タイポグラフィ: H1 `clamp(2.1rem, 2.8vw + 1rem, 3.3rem)` / line-height 1.15 / tracking tight; H2 `clamp(1.65rem, 1.4vw + 1rem, 2.25rem)` / line-height 1.25; Body 1.0625rem / line-height 1.75。
  - カラー: 既存 `--spf-primary #0b7a9c` をブランドカラーとして維持。ボタンホバー時明度差 7〜10%。グラデーション使用箇所は Hero / Final CTA の2箇所のみ（ノイズ低減）。
  - 角丸: ボタン 14px、カード 18px、モックアップ 24px、スウォッチ 12px、バッジ 999px。
  - 標高: Elevation 0（Header blur透明） / E1（カード `0 1px 2px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06)`） / E2（CTAボタン `0 10px 26px rgba(11,122,156,.32)`） / E3（最終CTAボックス `0 30px 70px rgba(11,122,156,.24)`）。
- **NFR-2 パフォーマンス**: 追加アセット 0、CSS追加分 300行以内。スクロール時の再描画を抑えるため、sticky header と backdrop-filter は `transform: translateZ(0)` 付与。
- **NFR-3 言語間差異ゼロ**: CSS 上で `:lang(ja)` などの分岐は**一切使用しない**。全言語共通のスタイルのみ。
- **NFR-4 コントラスト**: 既存の16.8:1を維持。背景のグラデーション上に白文字を置く場合、最低限の明度差保証のためグラデーションの暗い側を底上げ。
- **NFR-5 クローラブル**: スタイル隠しで `display:none` する文言は追加しない。構造化データと可読テキストの一致性を維持。

## Constraints
- **Technical**:
  - 静的HTML + 既存 `styles.css` の上書き/追記のみ。外部ライブラリ・フレームワーク（React/Vue/Tailwind/FontAwesome/GoogleFonts）不許可。
  - `site/assets/css/styles.css` の既存変数（`:root` の `--spf-*`）は**全て維持**。必要に応じて新しい変数を追加可（既存値の変更は禁止ではないが影響範囲を確認）。
  - 全HTMLファイル（計17ファイル: `index.html` + 4言語×4ページ）の `<head>` メタ・JSON-LD 文字列は **1byteたりとも変更しない**（この制約最優先）。`<body>` 配下のタグとクラス名と構造だけを変更対象。
- **Business**:
  - ブランド名・アプリ名表記: 「SimplePhotoFrame」継続。
  - 課金要素なし、CTAは「App Store でダウンロード / Download on the App Store」系のみ。
- **Dependencies**: 無し。ローカルファイルシステム上で完結。

## Assumptions
- ユーザー要望の「洗練された感じ」＝ 現行SaaSベンチマーク（Linear/Vercel/Raycast/Notion LP）のような、大きな余白・落ち着いたシャドウ・モダンな角丸バランス・最小限のグラデーション・ノイズの少ない視覚階層、と解釈する。
- 「基本的にすべて同じデザイン」＝ ヘッダー・フッター・各セクションのCSSクラスと配置を全言語で一致。テキストの長さ（日本語80字/英語20単語 等）による自動折り返し差異は許容。

## Acceptance Criteria

### AC-1: 全言語・全ページ HTML構造・クラス名完全共通化
- **Type**: `rule`
- **Given**: `site/ja|en|es|zh-Hans/` 配下各4ページ（計16ファイル）＋ `site/index.html`
- **When**: Grep で「同一ロール（ヘッダー/パンくず/Hero/Problemカード/Concept①/Concept②/Features/設定/言語カード/Privacy/FAQ/Why/Final CTA/Footer/記事ページarticle）」の開始タグクラス名を比較
- **Then**: 4言語の同ロール箇所は**同一のクラス名セット**を使用しており、旧クラス名 (`site-nav / hero-inner / hero-mockup / section-problem / card-grid-4 / card-problem / card-icon / color-palette / palette-swatch / two-col-box / testi-bullets / final-cta-inner / footer-inner / footer-links` 等) が **1件も残存しない**。
- **Pass Condition**: Grep 対象旧クラス名の hit count = 0、かつ 新共通クラス名のページ間出現回数一致。
- **Evidence**: PowerShell `Get-ChildItem site -Recurse -Filter *.html | Select-String "旧クラス名" | Measure-Object` = 0。

### AC-2: SEO・AI引用資産 完全無改変保証
- **Type**: `rule`
- **Given**: 編集前後の各HTML `<head>` ブロック（開始 `<!DOCTYPE>` から `</head>` まで）
- **When**: 4言語 index と `site/index.html` の `<head>` を git diff で比較
- **Then**: `<head> 〜 </head>` 内の行は **1行も差分が無い**（title / meta / canonical / hreflang / og / twitter / JSON-LD / stylesheet link / script src が完全一致）。
- **Pass Condition**: `git diff -- site/*/index.html site/index.html` で `<head>` 内に変更行 0 件。
- **Evidence**: Git diff 結果スクリーンショットまたは `git diff --stat` で `<head>` 部分無変更が示せること。

### AC-3: FAQ exact 文言 & JSON-LD 内容維持
- **Type**: `rule`
- **Given**: `site/ja/privacy.html` の exact 文言と `site/ja|en|es|zh-Hans/index.html` の JSON-LD
- **When**: Grep で下記文字列を検索
- **Then**:
  1. `ja/privacy.html` 内に **`本アプリは、お客様が選択した写真をサーバーにアップロードしません。`** が 1 回だけ出現。
  2. 4言語 index 全てに JSON-LD SoftwareApplication の `name="SimplePhotoFrame"` と `offers.price="0"` が出現。
  3. FAQ `<details>` の数と Q 文の先頭一致数が前後不変 (各言語 8問、最初のQ文完全一致)。
- **Pass Condition**: 上記 1〜3 全て満たす。
- **Evidence**: PowerShell `Select-String` ヒットカウント。

### AC-4: デザイン洗練度（洗練されたSaaS LP風）
- **Type**: `rubric`
- **Dimension**: 視覚的洗練度 − 余白・タイポグラフィ・シャドウ・角丸・視覚階層の5項目総合
- **Scale**: 1-5
- **Anchors**:
  - 1 = ブラウザデフォルトスタイル、スペーシング無し
  - 3 = 一般的なコーポレートサイト水準。セクション間隔 40px 程度、影はほのか。
  - 5 = Linear/Vercel/Raycast のLPレベル。スペーシングが大きく (80px+) 呼吸感あり。タイポグラフィのスケールが明確。Elevation（影）の階層が 0 / E1 / E2 / E3 で使い分けられており、カード・ボタンの角丸が適切。HeroとFinal CTAだけがアクセント。
- **Pass Threshold**: >= 4
- **Evidence**: ブラウザスナップショット 4言語トップ（各 1枚、hero+features+faq 範囲）を比較。

### AC-5: 全言語同デザイン保証
- **Type**: `rubric`
- **Dimension**: 言語間デザイン一致性
- **Scale**: 1-5
- **Anchors**:
  - 1 = 言語ごとにレイアウトが明らかに異なる
  - 3 = 大部分共通だが、ヘッダーやフッターの要素数が異なる
  - 5 = 4言語並べてスクショ比較して**テキスト内容以外の見た目が完全に同一**。カード数・グリッド数・ボタンサイズ・影の大きさ・パディングが全言語で一致。
- **Pass Threshold**: >= 4
- **Evidence**: 4言語トップページのブラウザスクリーンショット（同一ウィンドウ幅 1280px）横並び比較。

### AC-6: モバイル (560px幅) での可読性・タップ適正
- **Type**: `rule`
- **Given**: DevTools 幅 560px で `ja/index.html` を表示
- **When**: 目視で下記項目を検証
- **Then**:
  - CTAボタン（Hero・Final CTA 計2箇所）は幅 100%（全幅表示）で、高さ 48px 以上。
  - 言語切替の各 `<a>` タップエリア 44×44px 以上。
  - グリッド（card-grid/feature-grid/usecases 等）は全て 1カラムに折りたたまれ、横スクロールが発生しない。
  - 最長のFAQ Q文が15文字以内改行で自然。
- **Pass Condition**: 上記 4 項目 全て満たす。
- **Evidence**: 560px 幅ブラウザスナップショット。

### AC-7: A11y コントラスト維持（WCAG AA 4.5:1）
- **Type**: `rule`
- **Given**: 主要なテキスト 3 パターン (Body White on #f7f9fc / Body on Dark footer / Primaryボタン白文字)
- **When**: コントラスト比計算 (オンラインツール相当)
- **Then**: 全ての組で 4.5:1 以上。既存最高値 16.8:1 を下回らないことが望ましいが、最低 4.5:1 を保証。
- **Pass Condition**: 3パターンとも 4.5:1 以上。
- **Evidence**: コントラスト比計算結果を CSS 変数値から手計算で証跡記載。

## Open Questions
- [x] **Q1. デザインテイスト方向**: 本ドキュメント NFR-1 記載の「Linear/Vercel/Raycast 風モダンSaaS」方向で進めてよいか？ → ユーザー要望「洗練された感じ」と合致するため、Specデフォルト採用。
- [x] **Q2. 旧クラス名完全廃止**: 旧styles.css未定義クラスを一掃して styles.css 定義クラスに完全移行する方針でよいか？ → 全言語共通化の前提なのでデフォルト採用。
- [x] **Q3. 文言一切不変**: <head>+本文一切不変原則はユーザー要望「SEO/AI引用最優先」と合致。デフォルト採用。
