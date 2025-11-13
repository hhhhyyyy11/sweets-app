# Firebase Functions 環境変数設定

## LINE Login チャネルIDの設定

### 方法1: Firebase CLI を使用

```bash
firebase functions:config:set line.login_channel_id="YOUR_LINE_LOGIN_CHANNEL_ID"
firebase functions:config:set line.channel_access_token="YOUR_LINE_CHANNEL_ACCESS_TOKEN"
firebase functions:config:set line.channel_secret="YOUR_LINE_CHANNEL_SECRET"
```

設定内容を確認:
```bash
firebase functions:config:get
```

### 方法2: ローカル開発用の .runtimeconfig.json

`functions/.runtimeconfig.json` ファイルを作成:

```json
{
  "line": {
    "login_channel_id": "YOUR_LINE_LOGIN_CHANNEL_ID",
    "channel_access_token": "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
    "channel_secret": "YOUR_LINE_CHANNEL_SECRET"
  }
}
```

⚠️ **注意**: `.runtimeconfig.json` はGitにコミットしないでください（`.gitignore`に追加済み）

### 方法3: 環境変数（ローカル開発）

`functions/.env` ファイルを作成:

```bash
LINE_LOGIN_CHANNEL_ID=YOUR_LINE_LOGIN_CHANNEL_ID
LINE_CHANNEL_ACCESS_TOKEN=YOUR_LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET
```

## LINE チャネルIDの取得方法

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを選択
3. **LINE Loginチャネル**を作成または選択
4. 「チャネル基本設定」タブで「チャネルID」を確認

### LINE LoginチャネルとMessaging APIチャネルの違い

- **LINE Loginチャネル**: ユーザー認証用（LIFF、Web認証）
  - `login_channel_id`: このチャネルIDを使用
  - IDトークンの発行と検証に使用

- **Messaging APIチャネル**: Bot用（メッセージ送受信）
  - `channel_access_token`: Botのアクセストークン
  - `channel_secret`: Webhookの署名検証用

## デプロイ

環境変数を設定後、Functionsをデプロイ:

```bash
firebase deploy --only functions
```

特定の関数のみデプロイ:

```bash
firebase deploy --only functions:createCustomToken
```

## テスト

### ローカルでテスト

```bash
cd functions
npm run serve
```

### cURLでテスト

```bash
curl -X POST \
  http://localhost:5001/YOUR_PROJECT_ID/asia-northeast2/createCustomToken \
  -H 'Content-Type: application/json' \
  -d '{"idToken": "YOUR_LINE_ID_TOKEN"}'
```

本番環境:

```bash
curl -X POST \
  https://asia-northeast2-YOUR_PROJECT_ID.cloudfunctions.net/createCustomToken \
  -H 'Content-Type: application/json' \
  -d '{"idToken": "YOUR_LINE_ID_TOKEN"}'
```

## エラーハンドリング

### よくあるエラー

1. **"LINE_LOGIN_CHANNEL_ID is not configured"**
   - 環境変数が設定されていません
   - 上記の方法1または2で設定してください

2. **"LINE token verification failed"**
   - IDトークンが無効または期限切れ
   - チャネルIDが正しくない

3. **CORS エラー**
   - 関数は既に `Access-Control-Allow-Origin: *` を設定済み
   - プリフライトリクエスト（OPTIONS）にも対応済み

## ログの確認

```bash
# 最新のログを確認
firebase functions:log

# 特定の関数のログのみ
firebase functions:log --only createCustomToken

# リアルタイムでログを監視
firebase functions:log --only createCustomToken --follow
```
