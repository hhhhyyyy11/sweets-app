# API ドキュメント

研究室お菓子管理アプリのAPI仕様書です。

## Cloud Functions エンドポイント

すべてのCloud Functionsは以下のベースURLで公開されます:

```
https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/
```

## 認証API

### createCustomToken

LINE IDトークンをFirebaseカスタムトークンに変換します。

- **エンドポイント**: `POST /createCustomToken`
- **リージョン**: `asia-northeast2` (東京)
- **ドキュメント**: [API_CREATE_CUSTOM_TOKEN.md](./API_CREATE_CUSTOM_TOKEN.md)

**使用例**:
```typescript
const response = await fetch(
  'https://asia-northeast2-YOUR_PROJECT_ID.cloudfunctions.net/createCustomToken',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: 'YOUR_LINE_ID_TOKEN' })
  }
);
```

## LINE Bot Webhook

### lineWebhook

LINE Botからのメッセージを受信・処理します。

- **エンドポイント**: `POST /lineWebhook`
- **リージョン**: デフォルト (`us-central1`)
- **用途**: LINE Platform からの Webhook
- **認証**: LINE署名検証

**対応コマンド**:
- `一覧` / `リスト`: 在庫一覧表示
- `消費 [お菓子名] [個数]`: お菓子の消費記録
- `ヘルプ` / `使い方`: 使い方表示

## REST API

### api

お菓子管理、履歴、ユーザー管理のREST APIです。

- **エンドポイント**: `/api/*`
- **リージョン**: デフォルト (`us-central1`)
- **認証**: Firebase Authentication (推奨)

#### お菓子管理

##### お菓子一覧取得

```
GET /api/sweets
```

**レスポンス**:
```json
{
  "sweets": [
    {
      "id": "sweet_id",
      "name": "ポテトチップス",
      "description": "塩味",
      "imageUrl": "https://...",
      "stock": 10,
      "createdAt": {...},
      "updatedAt": {...}
    }
  ]
}
```

##### お菓子追加

```
POST /api/sweets
```

**リクエスト**:
```json
{
  "name": "ポテトチップス",
  "description": "塩味",
  "imageUrl": "https://...",
  "stock": 10
}
```

**レスポンス**:
```json
{
  "id": "generated_id",
  "message": "Sweet created successfully"
}
```

##### お菓子更新

```
PUT /api/sweets/:id
```

**リクエスト**:
```json
{
  "name": "ポテトチップス",
  "description": "コンソメ味",
  "stock": 15
}
```

##### お菓子削除

```
DELETE /api/sweets/:id
```

#### 消費履歴

##### 消費履歴取得

```
GET /api/consumption-history?limit=50
```

**クエリパラメータ**:
- `limit` (optional): 取得件数（デフォルト: 50）

**レスポンス**:
```json
{
  "history": [
    {
      "id": "history_id",
      "sweetId": "sweet_id",
      "sweetName": "ポテトチップス",
      "userId": "line_user_id",
      "quantity": 2,
      "timestamp": {...}
    }
  ]
}
```

#### ユーザー管理

##### ユーザー一覧取得

```
GET /api/users
```

**レスポンス**:
```json
{
  "users": [
    {
      "id": "line_user_id",
      "lineUserId": "line_user_id",
      "displayName": "田中太郎",
      "pictureUrl": "https://...",
      "role": "user",
      "createdAt": {...},
      "updatedAt": {...}
    }
  ]
}
```

## エラーレスポンス

すべてのAPIは以下の形式でエラーを返します:

```json
{
  "error": "Error message here",
  "details": "Additional details (optional)"
}
```

### HTTPステータスコード

| コード | 説明 |
|-------|------|
| 200 | 成功 |
| 400 | リクエストが不正 |
| 401 | 認証が必要 |
| 403 | アクセス権限なし |
| 404 | リソースが見つからない |
| 405 | メソッドが許可されていない |
| 500 | サーバーエラー |

## レート制限

現在、レート制限は設定されていません。
本番環境では適切なレート制限の実装を推奨します。

## CORS

### createCustomToken

- すべてのオリジンを許可: `Access-Control-Allow-Origin: *`

### api (REST API)

- すべてのオリジンを許可: `cors({ origin: true })`

## セキュリティ

### 認証

- **createCustomToken**: LINE IDトークン検証
- **lineWebhook**: LINE署名検証
- **api**: Firebase Authenticationトークン検証（推奨、現在は未実装）

### Firestoreセキュリティルール

`firestore.rules` でデータアクセスを制御:

- 読み取り: 認証済みユーザーのみ
- 書き込み: 管理者または本人のみ
- 管理者権限: `role == 'admin'`

## 開発環境

### ローカルエミュレーター

```bash
firebase emulators:start
```

- Functions: http://localhost:5001
- Firestore: http://localhost:8080

### テスト用cURL

```bash
# createCustomToken
curl -X POST http://localhost:5001/YOUR_PROJECT_ID/asia-northeast2/createCustomToken \
  -H 'Content-Type: application/json' \
  -d '{"idToken":"YOUR_TOKEN"}'

# お菓子一覧取得
curl http://localhost:5001/YOUR_PROJECT_ID/us-central1/api/sweets
```

## バージョン

現在のバージョン: **1.0.0**

## 変更履歴

### 1.0.0 (2025-11-12)

- 初回リリース
- createCustomToken API追加
- LINE Bot Webhook実装
- REST API実装

## サポート

問題が発生した場合は、プロジェクトリポジトリのIssuesセクションで報告してください。
