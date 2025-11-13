# LINE Bot 環境変数設定手順

## 必要な情報

LINE Developersコンソール (https://developers.line.biz/console/) から以下の情報を取得してください:

### 1. Messaging API チャネル（LINE Bot用）
- **Channel Secret**: チャネルシークレット
- **Channel Access Token**: チャネルアクセストークン（長期）

### 2. LINE Login チャネル（LIFF用）
- **Channel ID**: チャネルID

---

## ローカル開発環境の設定

### ステップ1: `.runtimeconfig.json`ファイルを作成

`functions/.runtimeconfig.json`ファイルを作成して、以下の内容を記述します:

```json
{
  "line": {
    "channel_secret": "YOUR_MESSAGING_API_CHANNEL_SECRET",
    "channel_access_token": "YOUR_MESSAGING_API_CHANNEL_ACCESS_TOKEN",
    "login_channel_id": "YOUR_LINE_LOGIN_CHANNEL_ID"
  }
}
```

### ステップ2: 実際の値に置き換え

上記の`YOUR_...`の部分を、LINE Developersコンソールから取得した実際の値に置き換えてください。

例:
```json
{
  "line": {
    "channel_secret": "abc123def456...",
    "channel_access_token": "eyJhbGciOiJI...",
    "login_channel_id": "1234567890"
  }
}
```

### ステップ3: ローカルエミュレータで確認

```bash
cd functions
npm run build
cd ..
firebase emulators:start
```

---

## 本番環境（Firebase）への設定

### 方法1: Firebase CLIで設定（推奨）

プロジェクトのルートディレクトリで以下のコマンドを実行:

```bash
# Messaging API (Bot) の設定
firebase functions:config:set line.channel_secret="YOUR_MESSAGING_API_CHANNEL_SECRET"
firebase functions:config:set line.channel_access_token="YOUR_MESSAGING_API_CHANNEL_ACCESS_TOKEN"

# LINEログイン (LIFF) の設定
firebase functions:config:set line.login_channel_id="YOUR_LINE_LOGIN_CHANNEL_ID"
```

### 設定内容を確認

```bash
firebase functions:config:get
```

### 本番環境にデプロイ

```bash
firebase deploy --only functions
```

---

## トラブルシューティング

### エラー: "LINE_CHANNEL_ACCESS_TOKEN is not configured"

→ `.runtimeconfig.json`（ローカル）または`firebase functions:config:set`（本番）で設定を行ってください。

### ローカルエミュレータで設定が反映されない

→ `functions/.runtimeconfig.json`が正しい場所にあるか確認してください。
→ エミュレータを再起動してください。

---

## セキュリティ注意事項

⚠️ **重要**: 
- `.runtimeconfig.json`ファイルは`.gitignore`に追加済みです
- このファイルをGitにコミットしないでください
- チャネルシークレットやアクセストークンは公開しないでください
