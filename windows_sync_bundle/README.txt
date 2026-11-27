Windows PC への持ち帰り用フォルダです。

使い方:
1. この `windows_sync_bundle` フォルダごと、Windows 側のプロジェクト直下へコピーする
2. 例:
   D:\work\SimplePhotoFrame-pre-release\windows_sync_bundle\
3. その後、Windows 側のプロジェクトルートで次のいずれかを実行する

推奨:
  node windows_sync_bundle/apply-windows-sync.js --backup
  npm install

復元:
  node windows_sync_bundle/restore-windows-sync.js

ダブルクリック用:
  - apply-safe.cmd
  - restore-latest.cmd

注意:
- `windows_sync_bundle` は必ずプロジェクトルート直下に置いてください
- スクリプトは親フォルダをプロジェクトルートとして動作します
- 変更前バックアップは `_sync_backups/<timestamp>/` に作られます

同梱物:
- apply-windows-sync.js
- restore-windows-sync.js
- AI_REWRITE_PROMPT_windows_sync.md
- apply-safe.cmd
- restore-latest.cmd
