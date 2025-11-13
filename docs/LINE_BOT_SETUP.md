# LINE Bot Webhook セットアップガイド

このドキュメントでは、LINE Bot (Messaging API) のWebhookを設定する手順を説明します。

## 前提条件

- LINE Developersコンソールへのアクセス
- Messaging APIチャネルの作成済み
- Firebase Cloud Functionsのデプロイ権限

## 1. LINE Messaging APIチャネルの設定

### 1.1 チャネル情報の取得

LINE Developersコンソールから以下の情報を取得してください:

1. **Channel Secret** (チャネル基本設定タブ)
2. **Channel Access Token** (Messaging API設定タブ)

### 1.2 Webhook URLの確認

デプロイ後のWebhook URLは以下の形式になります:

```
https://asia-northeast2-YOUR_PROJECT_ID.cloudfunctions.net/lineBotWebhook
```

`YOUR_PROJECT_ID`は、あなたのFirebaseプロジェクトIDに置き換えてください。

## 2. Firebase Functionsへの設定

### 2.1 環境変数の設定

Firebase CLIを使用して、LINE APIの認証情報を設定します:

```bash
# Channel Secretを設定
firebase functions:config:set line.channel_secret="YOUR_CHANNEL_SECRET"

# Channel Access Tokenを設定
firebase functions:config:set line.channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN"
```

### 2.2 設定の確認

```bash
firebase functions:config:get
```

以下のような出力が表示されます:

```json
{
  "line": {
    "channel_secret": "YOUR_CHANNEL_SECRET",
    "channel_access_token": "YOUR_CHANNEL_ACCESS_TOKEN"
  }
}
```

## 3. Cloud Functionsのデプロイ

### 3.1 関数のデプロイ

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:lineBotWebhook
```

### 3.2 デプロイ確認

デプロイが成功すると、以下のようなURLが表示されます:

```
Function URL (lineBotWebhook): https://asia-northeast2-YOUR_PROJECT_ID.cloudfunctions.net/lineBotWebhook
```

このURLをコピーしてください。

## 4. LINE Webhook URLの設定

### 4.1 Webhook URLの登録

1. LINE Developersコンソールを開く
2. 該当のMessaging APIチャネルを選択
3. **Messaging API設定**タブを開く
4. **Webhook URL**セクションで「編集」をクリック
5. デプロイされたCloud FunctionのURLを入力
6. 「更新」をクリック

### 4.2 Webhookの有効化

1. **Webhook設定**の「Webhookの利用」をONにする
2. 「検証」ボタンをクリックして接続を確認

## 5. 動作確認

### 5.1 LINE公式アカウントを友だち追加

1. LINE Developersコンソールの**Messaging API設定**タブでQRコードを表示
2. LINEアプリでQRコードを読み取って友だち追加

### 5.2 メッセージ送信テスト

LINE公式アカウントにテキストメッセージを送信してください。

**送信例:**
```
ポテトチップス
```

**期待される返信:**
```
リクエストを受け付けました✅

お菓子名: ポテトチップス

管理者が確認後、対応いたします。
```

### 5.3 Firestoreでの確認

Firebase Consoleを開き、`requests`コレクションに以下のようなドキュメントが作成されていることを確認してください:

```json
{
  "userId": "Uxxxxxxxxxxxx",
  "userName": "テストユーザー",
  "candyName": "ポテトチップス",
  "description": "LINE Botから送信: ポテトチップス",
  "status": "requested",
  "createdAt": "Timestamp",
  "updatedAt": "Timestamp"
}
```

## 6. トラブルシューティング

### 署名検証エラー

```
Error: Invalid LINE signature
```

**原因:** Channel Secretが正しく設定されていない

**対処法:**
1. `firebase functions:config:get`で設定を確認
2. LINE Developersコンソールで正しいChannel Secretをコピー
3. 再度設定してデプロイ

### Channel Access Tokenエラー

```
Error: LINE API error
```

**原因:** Channel Access Tokenが無効または期限切れ

**対処法:**
1. LINE DevelopersコンソールでChannel Access Tokenを再発行
2. `firebase functions:config:set`で新しいトークンを設定
3. 再度デプロイ

### Webhook接続エラー

```
Webhook verification failed
```

**原因:** Webhook URLが間違っているか、関数がデプロイされていない

**対処法:**
1. Firebase Consoleで関数がデプロイされていることを確認
2. URLが正しいことを確認（特にリージョン`asia-northeast2`）
3. Cloud Functionsのログを確認

## 7. ログの確認

Firebase Cloud Functionsのログを確認するには:

```bash
firebase functions:log
```

または、Firebase Consoleの「Functions」→「ログ」タブで確認できます。

## 8. 機能の仕様

### リクエストの保存

ユーザーから送信されたテキストメッセージは、以下の形式で`requests`コレクションに保存されます:

| フィールド | 型 | 説明 |
|----------|------|------|
| userId | string | LINE User ID |
| userName | string | LINEの表示名 |
| candyName | string | 送信されたテキスト内容 |
| description | string | "LINE Botから送信: [テキスト]" |
| status | string | 常に "requested" |
| createdAt | Timestamp | リクエスト作成日時 |
| updatedAt | Timestamp | 更新日時 |

### 返信メッセージ

ユーザーには以下のメッセージが返信されます:

```
リクエストを受け付けました✅

お菓子名: [送信されたテキスト]

管理者が確認後、対応いたします。
```

### エラーハンドリング

エラーが発生した場合、ユーザーには以下のメッセージが返信されます:

```
申し訳ございません。エラーが発生しました。
しばらく時間をおいて再度お試しください。
```

## 9. セキュリティ

### 署名検証

すべてのリクエストは、LINEプラットフォームからの正当なリクエストであることを確認するため、`X-Line-Signature`ヘッダーを使用して署名検証が行われます。

### 認証情報の管理

- Channel SecretとAccess Tokenは、Firebase Functions Configに安全に保存されます
- これらの情報はコードに直接記述しないでください
- `.env`ファイルは`.gitignore`に含めてください

## 10. 本番環境への移行

本番環境にデプロイする際は:

1. すべての環境変数が正しく設定されていることを確認
2. Firestoreのセキュリティルールが適切に設定されていることを確認
3. LINE公式アカウントの認証状態を確認（未認証/認証済み）
4. レート制限に注意（LINE Messaging APIの制限を確認）

## 参考リンク

- [LINE Messaging API リファレンス](https://developers.line.biz/ja/reference/messaging-api/)
- [Firebase Functions ドキュメント](https://firebase.google.com/docs/functions)
- [@line/bot-sdk ドキュメント](https://line.github.io/line-bot-sdk-nodejs/)
