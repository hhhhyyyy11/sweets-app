# LINE Bot 環境変数設定（.env方式）

## 設定手順

### ステップ1: LINE Developersから情報を取得

https://developers.line.biz/console/ にアクセス

**Messaging API チャネル**から:
- Channel Secret
- Channel Access Token（長期）

**LINE Login チャネル**から:
- Channel ID

### ステップ2: `functions/.env`ファイルを作成

`functions/.env`ファイルを作成して以下を記述:

```bash
# Messaging API チャネル（LINE Bot用）
LINE_CHANNEL_SECRET=あなたのChannel Secret
LINE_CHANNEL_ACCESS_TOKEN=あなたのChannel Access Token

# LINE Login チャネル（LIFF用）  
LINE_LOGIN_CHANNEL_ID=あなたのChannel ID
LINE_LOGIN_CHANNEL_SECRET=あなたのLINE LoginのChannel Secret
```

### ステップ3: 動作確認

```bash
cd functions
npm run build
cd ..
firebase emulators:start
```

---

## 注意事項

⚠️ `functions/.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
⚠️ 本番環境には`firebase functions:config:set`で設定する必要があります

## 本番環境への設定

```bash
firebase functions:config:set line.channel_secret="YOUR_VALUE"
firebase functions:config:set line.channel_access_token="YOUR_VALUE"
firebase functions:config:set line.login_channel_id="YOUR_VALUE"
```
