# SimplePhotoFrame LP — Design Polish v2 Implementation Plan (tasks.md)

## Task 1: styles.css リニューアル（共通化ベース整備 + 洗練）
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None (Spec 承認後即実行可)
- **Description**:
  - `:root` CSS変数を維持 (`--spf-*` 既存値は原則据え置き) しつつ、不足している elevation 変数・border-radius スケール変数を追加。
  - 全13セクションに対応するクラス (`site-header / container / breadcrumb / hero × hero-grid / hero-art / section / section-problem / section-concept-sustainable / section-concept-reuse / section-features / section-settings-lang / section-privacy-local / section-faq / section-why / final-cta / site-footer / article`) を、SaaS LP標準スタイルにブラッシュアップ。
  - 各グリッド系: `.card-grid / .feature-grid / .usecases / .steps / .langs / .matte-palette / .privacy-box / .footer-grid / .faq-list` の gap / padding / レスポンシブ折りたたみ条件を適正化。
  - Elevation体系 E0/E1/E2/E3 を明確化し、各要素に影を割当。
  - 不要・冗長な旧セレクタ（存在しないHTMLに対するスタイル）は削除し、サイズを 500〜600 行程度に整理。
  - モーション: `:hover` / `:focus` / `<details>[open]` / `.btn` 押下に最小限の transition 追加 (0.15s ease)。
- **Acceptance Criteria Addressed**: AC-4 (デザイン洗練度), AC-6 (モバイル), AC-7 (コントラスト), AC-5 (間接的: クラス共通化)
- **Test Requirements**:
  - `rule` TR-1.1: `styles.css` 内に旧HTML用の未定義クラスセレクタ（`site-nav / hero-inner / hero-mockup / section-problem-class / two-col-box / testi-bullets / final-cta-inner` 等）が存在しないこと。Grep count = 0。
  - `rule` TR-1.2: 主要コントラスト 3 パターン (Text #0f172a on bg #f7f9fc / Text #cbd5e1 on footer #0b1020 / White text on primary #0b7a9c) が全て 4.5:1 以上であること。手計算証跡記載。
  - `rubric` TR-1.3: **Dimension** CSSの整理度・再利用性。Scale 1-5。Anchors: 1=重複セレクタだらけ / 3=普通 / 5=BEM風単一クラス、変数活用、命名規則一貫。Pass Threshold >= 4。Evidence: 目視によるコードレビュー結果。
- **Notes**: 既存の変数・値は可能な限り維持。削除するセレクタは、Task2以降でHTML側も同時に削除されることを確認してから。

## Task 2: site/index.html (x-default) 構造共通化
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1 (CSS 完成 → HTMLクラス名確定)
- **Description**:
  - `<head>` ブロックは **byte 単位で完全維持**。diff 0 件が必須。
  - `<body>` 内の `<header>〜<footer>` を Task1 で定義した新クラス体系で再構築。FR-2 の 13セクション構造に厳密に従う。
  - 言語切替・内部リンクは `/ja/index.html` など絶対パスに。
  - 全てのテキスト（`hero-kicker` / H1 / H2 / H3 / p / li / summary / Q&A）は**既存のまま**、タグとクラス名のみを調整。
- **Acceptance Criteria Addressed**: AC-1 (共通化), AC-2 (head無改変), AC-3 (FAQ/文言一致)
- **Test Requirements**:
  - `rule` TR-2.1: `git diff site/index.html` で `<head> 〜 </head>` の範囲に変更行が 0 件であること。
  - `rule` TR-2.2: 旧クラス名 (`site-nav / hero-inner / hero-mockup / section-problem / card-icon / two-col-box / final-cta-inner / footer-inner / footer-links`) を Grep して count=0 であること。
  - `rule` TR-2.3: 13 セクション (Header, Breadcrumb, Hero, Problem, Concept①, Concept②, Features, Settings&Lang, Privacy&Local, FAQ, Why, Final CTA, Footer) が DOM 順序通りに出現すること。目視と Grep で確認。

## Task 3: ja/en/es/zh-Hans の index.html（4言語トップ）構造共通化
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2 (site/index.html 完成 → 共通テンプレとして再利用可)
- **Description**:
  - **4 ファイル並行作業可だが、各 `<head>` は byte 単位完全維持が最優先**。
  - `<body>` 内は Task 2 の site/index.html と全く同じクラス名・タグ構造を使用。
  - 4言語それぞれで下記をキープ:
    - H1/H2/H3 の既存翻訳文は一切変更しない。
    - JSON-LD (SoftwareApplication + FAQPage) 完全維持。
    - FAQ `<details class="faq">` の Q文・A文 完全維持。
    - 各言語の exact 文言（ja/privacy exact 等）完全維持。
  - 4ファイル間で「クラス名の出現回数・タグのネスト階層」が完全一致（テキスト内容以外はdiffが構造的に同一）することを目標。
- **Acceptance Criteria Addressed**: AC-1 (共通化), AC-2 (head無改変), AC-3 (exact文言/FAQ数), AC-5 (言語間一致性)
- **Test Requirements**:
  - `rule` TR-3.1: `git diff -- site/ja/index.html site/en/index.html site/es/index.html site/zh-Hans/index.html` で、各ファイルの `<head>` 内変更行が 0 件であること。
  - `rule` TR-3.2: 4 ファイル全てで `<details class="faq">` の数 = 8 かつ SoftwareApplication JSON-LD 内 `name: "SimplePhotoFrame"` が存在すること。Grep count 一致。
  - `rubric` TR-3.3: **Dimension** 4言語間構造一致性。Scale 1-5。Anchors: 1=構造バラバラ / 3=大まか同じ / 5=クラス名・ネスト深さ・個数完全一致（テキスト除く）。Pass Threshold >= 4。Evidence: `diff --ignore-all-space --ignore-blank-lines` で structural diff が 0 に近いこと。

## Task 4: 4言語 × support/privacy/terms.html（計12記事ページ）構造共通化
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 3
- **Description**:
  - 各記事ページの `<head>` 完全維持（canonical や hreflang 5本・JSON-LDがあればそのまま）。
  - `<body>` を下記共通構造に固定:
    1. `<header class="site-header">` (言語切替メニュー付き)
    2. `<div class="container">`
       3. `<nav class="breadcrumb" aria-label="Breadcrumb">` (Home > Support/Privacy/Terms)
       4. `<article class="article">` 内部に既存の記事コンテンツ（`<h1><h2><p><ul>` 等）を完全維持して格納。
    5. `</div>`
    6. `<footer class="site-footer">`
  - 12 ページ全てで Header/Footer のクラス名・リンク先・言語切替メニューの配置が完全一致。
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3 (privacy exact 文言)
- **Test Requirements**:
  - `rule` TR-4.1: `site/ja/privacy.html` 内 exact 文言 **`本アプリは、お客様が選択した写真をサーバーにアップロードしません。`** の出現回数 = 1。
  - `rule` TR-4.2: 12ページ全て `<article class="article">` で囲まれていること。`<header class="site-header">` と `<footer class="site-footer">` が各 1 回出現。
  - `rule` TR-4.3: `<head>` の git diff 0 件。

## Task 5: main.js 軽微調整（必要な場合のみ）＋ 動作確認
- **Status**: `pending`
- **Priority**: low
- **Depends On**: Task 2-4
- **Description**:
  - 既存 `main.js`（FAQ の `<details>` 開閉スクロール連携等があれば）は機能維持。
  - `<details class="faq">` クラス名変更に合わせ、セレクタ不一致があれば修正。
  - 無用な alert / console.log があれば削除。
- **Acceptance Criteria Addressed**: AC-1 (クラス名連携)
- **Test Requirements**:
  - `rule` TR-5.1: `main.js` 内の DOM セレクタ (`querySelector/All`) で参照するクラス名が、Task1-4 で定義したクラス名と一致。存在しないクラス指定 0 件。
  - `rule` TR-5.2: 開発者ツール Console でエラー 0 件（ブラウザ確認）。

## Task 6: 目視・Grep による最終総合検証
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1-5 全て completed
- **Description**:
  - 全 HTML 17 ファイルを Grep 総当り:
    - 旧クラス名 一覧残存 0 件 (AC-1)
    - exact 文言 (privacy) 1 件 (AC-3)
    - FAQ `<details class="faq">` 8 個 / 言語トップ (AC-3)
  - ブラウザで 4 言語の index を 1280px / 960px / 560px の 3 水準で開き、下記を確認:
    - 横スクロール発生しない
    - CTA ボタン全幅 (560px)
    - Elevation 階層の視認 (E1カードが軽く浮き、E3 Final CTA ボックスが最も強い影)
    - 4 言語をタブで切り替えて、テキスト以外の見た目が同一 (AC-5)
  - A11y: focus outline が `.btn` / `<a>` / `<summary>` で見えること。
- **Acceptance Criteria Addressed**: AC-1 〜 AC-7 全件最終確認
- **Test Requirements**:
  - `rule` TR-6.1: 旧クラス名リスト Grep count = 0 全項目。
  - `rule` TR-6.2: 560px 幅で CTA ボタン 2 箇所が幅 100% 表示。
  - `rubric` TR-6.3: **Dimension** 総合仕上がり。Scale 1-5。Anchors 1=粗い / 3=普通 / 5=洗練されたSaaS LP同等。Pass >= 4。Evidence: スクリーンショット 4言語 × 3ブレイクポイント = 12枚。
- **Notes**: Task完了後に Review フェーズへ進むための最終 gate。
