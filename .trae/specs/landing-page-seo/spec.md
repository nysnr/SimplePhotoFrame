# SimplePhotoFrame 紹介 LP - Product Requirements Document

## Overview
- **Summary**: SimplePhotoFrame の公式紹介 Web ページを、静的ファイルで作成し Vercel または同等の無料ホスティングで公開する。Web 検索結果にヒットしやすく、かつ各種 LLM/AI エージェントが引用しやすい構造化メタデータ・FAQ・構造化コンテンツを備える。**二本柱のコンセプト①②を全面的に打ち出す**。
- **Purpose**: App Store 外からの流入（検索・被リンク・AI 引用）を増やし、アプリの存在を認知してもらうこと。またアプリの特徴・使い方・FAQ・プライバシー・利用規約・サポートを一箇所で案内する。**特に「古い端末を捨てずに最後まで使い切る」サステナブルな価値観と、「家庭に眠る・余っているデバイスの生活活用」の 2 つの文脈から訴求する**。
- **Target Users**: 
  - （コンセプト①）サステナブル・サーキュラーエコノミーに関心があり、「古い端末＝廃棄」ではなく使い切る方法を検索している生活者
  - （コンセプト②）家に「使っていない iPad・古い iPhone・Android 端末」が複数台あり、何か活用できないかと探している一般家庭のユーザー
  - その他：フォトフレームアプリ、スライドショーアプリ、時計付き表示、端末再活用を検索している一般ユーザー
  - App Store の審査で要求されるプライバシーポリシー/利用規約/サポートページを確認する審査官・ユーザー
  - アプリの情報を要約/引用する ChatGPT、Perplexity、Google SGE、GPT Crawler などの AI エージェント

## Core Concepts
本 LP は導線（Hero / Features / How to use / FAQ / JSON-LD description）全体を通して、以下の 2 つのコンセプトを分かりやすく表出する。
- **① Sustainable な考え方へのアプローチ**:
  - 「古くなった・新しい機種に機種変したからといって、まだ動くデバイスを廃棄（電子ゴミ）にするのはもったいない」
  - 「最後まで使い切ることで、間接的に資源・環境負荷を減らす貢献につながる」
  - 必ずしも大げさな環境活動を主張せず、「個人の身近な選択の積み重ね」として表現する。
- **② 余ったデバイスの活用方法（身近な課題）**:
  - 「使わなくなった iPad・iPhone・Android を、引き出しにしまったままではなく、フォトフレーム・時計付きフォトスタンドとしてリビング・キッチン・玄関・子供部屋に飾って活用」
  - 具体的な場面例（家族写真の常時表示、成長記録、旅行思い出、時計として常時表示、プレゼントや孫の写真を遠方の祖父母に送るなど）を盛り込む。
  - 難しい設定は不要、3 ステップで使い始められる「身近なソリューション」であることを強調する。

## Goals
- 無料の運用で済む構成（Vercel Hobby または GitHub Pages）
- 多言語 LP（日本語、英語、スペイン語、中国語簡体）に対応し、hreflang で相互リンクする。**多言語のそれぞれで「①サステナブル」「②余ったデバイス活用」の両コンセプトが伝わる**ローカライズを行う。
- コンセプト①②を基にした SEO キーワード戦略：
  - 日本語：「古い iPad 活用」「古いスマホ 活用」「フォトフレーム アプリ」「サステナブル アプリ」「電子ゴミ 削減」「使い古した タブレット 再利用」
  - 英語：`old ipad reuse` `unused tablet photo frame` `reuse old phone` `sustainable apps` `turn old ipad into picture frame`
  - スペイン語：`reutilizar ipad viejo` `marco de fotos con tablet` `reutilizar movil antiguo`
  - 中国語簡体：`旧ipad 再利用` `旧手机 相框` `闲置平板 利用`
- SEO 強化：title/description/h1/h2 の整理、robots.txt、sitemap.xml、OGP/Twitter Card、構造化データ JSON-LD（SoftwareApplication, FAQPage, BreadcrumbList など）
- AI 引用強化：ページをセマンティック HTML 化、FAQ 構造化、メタデータの明確化、クローラー拒否設定なし（AI クローラーへの明示的許可は任意）。**「古い端末の活用」「サステナブル」の2文脈を description と FAQ に積極的に埋め込み、LLM が文脈を理解しやすくする**。
- 既存 docs フォルダの privacy/support/terms の各言語版を新 LP に統合（App Store 審査要求を満たす）
- App Store / Google Play（未定ならリンク未掲載可）への誘導 CTA を配置
- モバイルファースト・レスポンシブデザインで、Lighthouse SEO スコア 95 以上を目指す
- CDN からの配信で初期表示が 2 秒以内、超軽量（依存関係なしの HTML/CSS/JS 手書き）

## Non-Goals
- 動的 CMS（WordPress, Next.js SSR/ISR, microCMS など）の導入
- ユーザー登録・ログイン・お問い合わせフォーム（メールアドレスまたは SNS リンクでの案内に留める）
- 購読・決済・広告ネットワークの埋め込み
- 複雑なデザインシステム・フレームワークの導入（React/Vue/Next などは不要）
- SEO 用の不自然なキーワードスタッフィング
- アプリのライセンス・OSS 帰属表示ページ（App 内と重複するため、本 LP のスコープ外）

## Background & Context
- アプリ：SimplePhotoFrame（Expo + React Native 製）
- 機能：写真ライブラリから写真を選択、スライドショー、時計/日付表示の有無とサイズ切替、額縁カラー（マットカラー）複数、インターバル設定、広告（AdMob）表示、多言語（日本語・英語・スペイン語・中国語簡体）
- 既存資産：
  - 既存 [docs/privacy.html](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/docs/privacy.html)、[docs/support.html](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/docs/support.html)、[docs/terms.html](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/docs/terms.html)
  - [App.js の文字列・機能一覧](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/App.js#L45-L250)
  - アプリ設定：[app.config.js](file:///c:/Users/AINE/source/PhotoFrame/PhotoFrameNew/app.config.js)
- ホスティング：Vercel を推奨案とする（GitHub Pages でも代替可）。ただしデプロイは手作業または GitHub Actions のどちらかを選べるように、生成物は静的ファイルのみにする
- 想定ドメイン：無料サブドメイン（xxx.vercel.app）または GitHub Pages サブドメイン。独自ドメインは将来オプションとする

## Functional Requirements

### FR-1: トップページ（多言語・コンセプト①②表出）
- `/index.html` または `/<lang>/index.html` の形で、4 言語（日本語 ja / 英語 en / スペイン語 es / 中国語簡体 zh-Hans）が提供される
- トップページには以下のセクションを含む。特に **コンセプト①（サステナブル：古い端末を使い切る）** と **コンセプト②（余ったデバイス活用：身近な課題の解決）** が、Hero と Features と Use cases / FAQ のそれぞれに重複して表出される構成にする。
  - 0. **言語切替ヘッダー**
  - 1. **ヒーロー Hero**: タイトル（アプリ名） + **2 コンセプトに共鳴するキャッチコピー**（例：まだ使える古い端末を、思い出のフォトフレームに。） + App Store への CTA ボタン
  - 2. **Problem / Challenges（課題感）**: 「引き出しに眠る古い iPad/スマホ」「新しい端末を買うと古い端末が余る」「電子ゴミを減らしたいけど、個人でできることが少ない」「大切な写真がクラウドやライブラリに埋もれて見られていない」を 3〜4 点で記載
  - 3. **Concept ① Sustainable**: 「まだ動く端末を捨てない。最後まで使い切る選択肢」というスタンスを 1 セクション分使って説明。環境への負荷・電子ゴミ削減といった話題を、過剰にならない範囲で自然に配置
  - 4. **Concept ② Reuse in Daily Life**: リビング・キッチン・玄関・書斎・子供部屋・祖父母宅などの具体的な活用場面を 4〜6 点の Use cases で例示
  - 5. **Features**: フォトフレーム機能（スライドショー、時計ON/OFF とサイズ、マットカラー8種、切替間隔 秒/分）、無料・広告モデル、4 言語対応、プライバシー（写真をサーバーに送らない）
  - 6. **How to use（3 ステップ）**: 1. 古い端末にアプリをインストール 2. 表示したい写真を選ぶ 3. 好みの設定にして飾る、という最小手順での説明
  - 7. **Settings details**: 時計・日付表示サイズ、インターバル、マットカラー 8 種一覧など、実際の設定画面と対応する内容
  - 8. **Supported languages**
  - 9. **Privacy & Local processing**: 写真は端末内だけで処理、アップロードしない旨を明記
  - 10. **FAQ（最低 8 項目以上）**: うち 3 項目以上はコンセプト①②に直接関連する Q&A（例：「古い端末で遅くなりますか？」「写真は外部に送られますか？」「iPad の第一世代でも使えますか？」「廃棄せずに済むのは本当にエコなの？」など）
  - 11. **最後の CTA セクション**: App Store へのダウンロード誘導＋コンセプトの再スローガン
  - 12. **フッター**: プライバシーポリシー / 利用規約 / サポート / 著作権 / 各言語へのリンク
- 各セクションは H1/H2/H3 を正しく使用し、最初の H1 は 1 ページに 1 つのみ
- CTA には App Store リンク（今はブランク可、後で差し替えられるプレースホルダー）、メール等のサポート連絡先（ブランク可）を配置

### FR-2: プライバシーポリシー / 利用規約 / サポートページ
- 上記 3 ページを各言語で提供（FR-1 と同じ 4 言語）
- 既存 docs の内容を基に多言語化し、App Store 審査が要求する最低限の条項を含む（特に写真をアップロードしない旨・広告識別子の扱い）
- 各ページの最終更新日を明記
- フッターと Breadcrumb から必ず辿れる

### FR-3: 多言語相互リンク
- 全ページに hreflang を備えた alternate リンクを設置（en, ja, es, zh-Hans, x-default）
- 画面上にも明示的な言語切替 UI（国旗 or 言語名ボタン）を置き、各言語版に遷移できる

### FR-4: SEO 強化
- 全ページで `<title>`、`<meta name="description">`、OGP、Twitter Card を設定
- 公開ルートに `robots.txt` と `sitemap.xml` を配置。sitemap は全言語・全ページを網羅
- 構造化データ JSON-LD：
  - トップページ：SoftwareApplication（言語ごとに適切な name/operatingSystem/applicationCategory/applicationSubCategory/offers/screenshot を含む）、FAQPage（FAQ セクション分）、BreadcrumbList（必要に応じて）
  - 静的ページ（privacy/terms/support）：Article または BreadcrumbList
- Lighthouse SEO カテゴリがローカル計測で 95 以上（後述）

### FR-5: AI 引用強化
- 全セクションをセマンティック HTML（header/main/section/article/aside/footer/nav）で構成
- 構造化データ（FR-4）に加え、キーワードを強引に詰め込まない自然な文面で「アプリ名・開発者名・OS・特徴・価格（無料/広告あり）・対応言語・データ非送信」をそれぞれ明確に表出
- FAQ は 6 項目以上用意する（検索・AI 引用の両面で効果大）
- robots.txt で一般検索エンジンを許可し、GPTBot / Google-Extended / ClaudeBot などの AI クローラーについては明示的許可設定を設け（将来変更可、デフォルトは許可に揃える）

### FR-6: レスポンシブ表示とパフォーマンス
- 375px（iPhone SE）〜 1440px 以上までレイアウトが崩れない
- 外部 CDN の依存ライブラリを原則使わず、CSS/JS はすべて自前。Web フォントは任意（日本語表示を重視し、システムフォント優先で良い）
- オフスクリーン画像の lazy 有効化、alt 属性を全ての画像に付与
- Lighthouse Performance 90 以上、Accessibility 90 以上

### FR-7: デプロイ容易性
- Vercel に CLI で 1 コマンド（または GUI Import）でデプロイできる構成とする
- 代替として GitHub Pages にも移せるよう、ソースは全て静的ファイルで統一し、フレームワーク依存を排除する

## Non-Functional Requirements
- **NFR-1 無料運用**: 運用 1 年以上を無料の範囲で継続できること（Vercel Hobby の帯域制限等を鑑み、静的で軽量に保つ）
- **NFR-2 多言語性**: 日本語・英語・スペイン語・中国語簡体のそれぞれで自然な翻訳文を使用すること。機械翻訳のあとで一貫性と簡潔さを目視レビューすること
- **NFR-3 長期保守性**: 単一 HTML + 共通 CSS/JS で記述し、特定フレームワークのバージョンアップに追従するコストが 0 であること
- **NFR-4 正確性**: アプリが実際に提供していない機能を記載しない（現時点の機能：時計表示サイズ切替、マットカラー 8 種、インターバル（秒/分）設定、広告などは正確に記述）
- **NFR-5 審査適合**: プライバシーポリシー・利用規約・サポートページが実在し、App Store から直接リンク可能な URL であること
- **NFR-6 アクセシビリティ**: カラーコントラスト比 4.5:1 以上、フォーカスリング非破壊、alt 属性付与。Lighthouse A11y 90 以上

## Constraints
- **Technical**: 
  - 依存関係ゼロの静的ファイルのみ。フレームワーク禁止。
  - 既存リポジトリのルート下に新規フォルダ（例 `site/`）を作成し、そこに全資産をまとめる
- **Business**: 
  - コストは 0 円。広告表示・決済システムは導入しない
  - 個人情報収集（メールフォーム等）は行わない（サポート連絡先はリンクまたは mailto のみ可）
- **Dependencies**: 
  - TRAE の deploy_to_remote が Vercel のみサポートのため、まず Vercel をターゲットとする
  - Lighthouse（npx lighthouse）または同等のツールで SEO/Performance をローカル確認できる

## Assumptions
- 公式 App Store のリンクは今はプレースホルダーでも差し支えない。存在すればヒアリングして埋め込む
- サポート連絡先（メールアドレスまたは X/Twitter/Discord 等）は現時点で空欄または generic な表記にし、あとから差し替え可能
- SimplePhotoFrame のスクリーンショット画像はまだ用意できていない可能性が高いため、SVG のダミーまたは文字表現で先に組み、あとから差替可能とする
- 独自ドメインは今後の課題とし、当面は Vercel/GitHub Pages のサブドメインで公開する
- AI 引用のために AI クローラーの robots.txt 明示的許可をデフォルトにする。ユーザーから拒否要望が出たら反転可能

## Acceptance Criteria

### AC-1: トップページ 4 言語の存在
- **Type**: `rule`
- **Given**: ビルドされた静的サイトのフォルダが存在する
- **When**: 各言語ルートの HTML が存在することを確認する（例: site/index.html または site/ja/index.html, site/en/index.html, site/es/index.html, site/zh-Hans/index.html。いずれかのルーティング方式に統一）
- **Then**: 各言語バージョンが存在し、title/h1 が各言語で正しく表示される
- **Pass Condition**: 4 言語それぞれの HTML ファイルが存在し、ファイル内に当該言語のタイトル文言が書かれている
- **Evidence**: `ls -R site` の出力結果

### AC-2: 構造化データ JSON-LD が埋め込まれている
- **Type**: `rule`
- **Given**: 4 言語のトップページ HTML
- **When**: `<script type="application/ld+json">` で SoftwareApplication と FAQPage の 2 つ（または統合）が出力されているかを確認
- **Then**: SoftwareApplication には `name`、`operatingSystem`（iOS/iPadOS、Android 対応状況に応じて）、`applicationCategory`、`offers`（無料なので 0 円）、`inLanguage`、`aggregateRating`（任意）、`description` が含まれる。FAQPage には 6 件以上の Question/Answer ペアが含まれる
- **Pass Condition**: JSON-LD が構文エラーなくパースでき、必要キーが存在する
- **Evidence**: ローカル JSON パース結果 + Schema.org validator 互換の簡易チェック

### AC-3: robots.txt と sitemap.xml の存在とフォーマット
- **Type**: `rule`
- **Given**: 公開ルート直下に robots.txt と sitemap.xml がある
- **When**: Sitemap に 4 言語 × 全ページ（LP + 3 静的ページ = 計 16 URL 以上）が列挙されていることを確認。robots.txt でその sitemap URL を示し、主要検索 bot を許可
- **Then**: 形式的に valid かつクローラーに対して正しく誘導できている
- **Pass Condition**: sitemap.xml が XML スキーマに準拠し、16 URL 以上を列挙。robots.txt が Sitemap 行を含み、Disallow: / ではない
- **Evidence**: 各ファイルの内容出力

### AC-4: 多言語 hreflang と切替 UI
- **Type**: `rule`
- **Given**: 全 4 言語 × 4 ページ = 16 ページ
- **When**: それぞれの `<head>` の `<link rel="alternate" hreflang="...">` を確認
- **Then**: 全ページで 4 言語 + x-default の 5 本ずつリンクがあり、相互に正しい URL を指す。また画面上に言語切替 UI が存在する
- **Pass Condition**: 代表 1 ページをサンプルとして確認し、5 本の alternate があり、言語切替 UI が DOM に存在する
- **Evidence**: 代表ページ `<head>` の一部切り出し + 切替 UI セレクタの grep 結果

### AC-5: Lighthouse SEO 95 以上 / A11y 90 以上 / Performance 90 以上
- **Type**: `rubric`
- **Dimension**: Lighthouse スコア（デスクトップモード・ローカルで静的サーバー起動後に計測）
- **Scale**: 0-100 を 4 段階に換算。1=80 未満、3=90〜94、5=95 以上（各カテゴリ毎）
- **Anchors**: 1 = 重大な SEO 欠落（title/description/alt いずれか大量欠落）などで 80 を下回る; 3 = ギリギリ 90 台; 5 = ほぼ満点
- **Pass Threshold**: 全カテゴリで >= 90、かつ SEO で >= 95
- **Evidence**: `npx lighthouse` または `npx page-scan` の出力（実行できない場合はツール制約として別評価）

### AC-6: プライバシー / 規約 / サポートページの多言語版存在
- **Type**: `rule`
- **Given**: サイトをビルドしたフォルダ
- **When**: privacy, terms, support の各ページが 4 言語計 12 ファイル存在し、ページ内容に空きがない
- **Then**: App Store 審査で求められる内容（写真を送信しない旨、広告と ID の扱い、デベロッパ連絡先の記載または代替案）を含む
- **Pass Condition**: 12 ファイルが存在し、代表 1 言語（日本語）のプライバシーに「サーバーに写真をアップロードしない」の記述を確認できる
- **Evidence**: ファイル一覧 + 該当行の grep 出力

### AC-7: App Store CTA の存在（リンク先は仮でも可）
- **Type**: `rule`
- **Given**: 各言語のトップページ
- **When**: H1 直下またはファーストビューに App Store へのボタン（リンクは仮 URL または特定の文字列でも OK）が存在
- **Then**: 明確に「ダウンロード」と分かる CTA であること
- **Pass Condition**: 4 言語ページすべてに CTA ボタン相当の要素が存在し、かつ App Store の文言を含む
- **Evidence**: ページソースの grep 結果

### AC-8: 機能表記の正確性
- **Type**: `rubric`
- **Dimension**: 掲載機能と実アプリの機能との一致度
- **Scale**: 1-5
- **Anchors**: 1 = 虚偽機能が 2 つ以上掲載されている; 3 = 少し曖昧だが大きな嘘なし; 5 = 実装されている機能（時計ON/OFF、サイズ、マットカラー 8 種、インターバル秒/分、4 言語対応、広告あり、写真は端末内のみ処理）が正確に過不足なく記述
- **Pass Threshold**: >= 4
- **Evidence**: 手動で Features/FAQ セクションを読み、App.js の settings 項目と照合

### AC-9: デプロイ手順の実行可能性（Vercel CLI）
- **Type**: `rule`
- **Given**: 静的サイト資産が `site/` フォルダに一式揃っている
- **When**: TRAE の `deploy_to_remote`（vercel）または `vercel --prod` で本番デプロイを試みる
- **Then**: デプロイが成功し、公開 URL を返す（公開 URL を後述）
- **Pass Condition**: デプロイ成功し、公開 URL が存在
- **Evidence**: deploy コマンドの結果ログと公開 URL

### AC-10: コンセプト①②の表出度（Sustainable / Reuse）
- **Type**: `rubric`
- **Dimension**: ページ全体を通じた、「古い端末を捨てずに使い切る（サステナブル）」と「余ったデバイスを日常で活用（身近な課題解決）」の 2 コンセプトの明確さ
- **Scale**: 1-5
- **Anchors**: 
  - 1 = コンセプト①②のどちらの文脈もページ内に存在しない
  - 3 = どちらか一方が Hero のみにチラ見せ。活用場面例が 2 つ未満。FAQ にコンセプト関連が 1 項目未満。
  - 5 = Hero・Problem/Challenges セクション・専用の 2 セクション（Concept ①、Concept ②）・Features 内の文脈・FAQ 内の 3 項目以上・CTA 最後のスローガン、計 6 箇所以上でコンセプト①②を分かりやすく表出。活用場面例 4 つ以上。
- **Pass Threshold**: >= 4
- **Evidence**: 4 言語の代表（日本語・英語）について、セクション構成の一覧と FAQ のコンセプト関連項目数をカウントした一覧表

## Open Questions
- [ ] App Store の実際のリンク（apps.apple.com/jp/app/xxxx/idxxxxxxxxx 形式）は現在不明のため、プレースホルダーで先に作成します。後で差し替えます。
- [ ] サポート連絡先（メール / SNS）は後で差し替え可能とし、仮にサポートページに空欄または「お問い合わせ先は App Store レビューから」旨を記載します。
- [ ] デザインのカラーはアプリの雰囲気に合わせて自動提案します。後から自由に変更可能です。
- [ ] GitHub Pages への切替ニーズがあるか：当面 Vercel で進め、必要であれば後日 GitHub Actions workflow を追加
