# 研究室お菓子管理アプリ 🍭

LINE Bot (LIFF) と Web管理画面のハイブリッド構成のお菓子管理システムです。

## 技術スタック

- **フロントエンド**: React + TypeScript
- **バックエンド**: Cloud Functions for Firebase
- **データベース**: Cloud Firestore
- **認証**: Firebase Authentication + LINEログイン
- **メッセージング**: LINE Messaging API

## ディレクトリ構成

```
.
├── functions/         # Cloud Functions (バックエンド)
│   ├── src/
│   │   └── index.ts
│   └── package.json
├── public/            # React (フロントエンド)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── firebase.ts
│   │   └── components/
│   └── package.json
├── firestore.rules    # Firestoreセキュリティルール
├── firebase.json      # Firebase設定
└── .firebaserc        # Firebaseプロジェクト設定
```

## セットアップ手順

### 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Firestore Database を有効化
3. Authentication を有効化（Email/Password とカスタム認証を有効化）
4. Hosting を有効化

### 2. 環境変数の設定

#### フロントエンド (public/.env)

```bash
cd public
cp .env.example .env
```

`.env` ファイルに以下の値を設定:
- Firebase Console > プロジェクト設定 > 全般 > マイアプリ から Firebase の設定値を取得
- LINE Developers Console から LIFF ID を取得

#### バックエンド (functions/.runtimeconfig.json または Firebase CLI)

```bash
# LINE Messaging API (Bot用)
firebase functions:config:set line.channel_access_token="YOUR_LINE_CHANNEL_ACCESS_TOKEN"
firebase functions:config:set line.channel_secret="YOUR_LINE_CHANNEL_SECRET"

# LINE Login (認証用) - 重要!
firebase functions:config:set line.login_channel_id="YOUR_LINE_LOGIN_CHANNEL_ID"
```

設定を確認:
```bash
firebase functions:config:get
```

または、ローカル開発用に `functions/.runtimeconfig.json` を作成:

```json
{
  "line": {
    "login_channel_id": "YOUR_LINE_LOGIN_CHANNEL_ID",
    "channel_access_token": "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
    "channel_secret": "YOUR_LINE_CHANNEL_SECRET"
  }
}
```

⚠️ **重要**: LINE LoginチャネルID (`login_channel_id`) とMessaging APIチャネルのトークン/シークレットは別々のチャネルから取得します。詳細は `functions/ENVIRONMENT.md` を参照してください。

### 3. Firebase の設定

```bash
# Firebaseにログイン
firebase login

# プロジェクトIDを設定 (.firebasercを編集)
# "your-project-id" を実際のプロジェクトIDに置き換え
```

`.firebaserc` を編集:
```json
{
  "projects": {
    "default": "実際のプロジェクトID"
  }
}
```

### 4. 依存関係のインストール

#### フロントエンド

```bash
cd public
npm install
```

#### バックエンド

```bash
cd functions
npm install
```

### 5. LINE Bot と LINE Login の設定

#### LINE Messaging API (Bot用)

1. [LINE Developers Console](https://developers.line.biz/) でプロバイダーとチャネルを作成
2. **Messaging API** チャネルを作成
3. Webhook URL を設定: `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/lineWebhook`
4. Channel Access Token と Channel Secret を取得

#### LINE Login (認証用) - 重要!

1. 同じプロバイダーで **LINE Login** チャネルを作成（Messaging APIとは別のチャネル）
2. コールバックURLを設定:
   - `https://YOUR_PROJECT_ID.web.app/`
   - `http://localhost:3000/` (開発用)
3. LIFF アプリを作成
   - Endpoint URL: `https://YOUR_PROJECT_ID.web.app/`
   - Scope: `profile`, `openid`, `email`
4. Channel ID を取得（これが `login_channel_id` になります）

**📌 ポイント**: LINE BotとLINE Loginは別々のチャネルです!
- **Messaging API**: メッセージ送受信用
- **LINE Login**: ユーザー認証用（Web/LIFF）

### 6. 管理者ユーザーの作成

Firebase Console > Authentication から管理者用のメールアドレスとパスワードでユーザーを作成し、
Firestore の `users` コレクションに以下のドキュメントを手動で追加:

```javascript
{
  lineUserId: "LINE_USER_ID", // LINEのユーザーID
  displayName: "管理者名",
  pictureUrl: "",
  role: "admin",  // ← 重要: 管理者権限
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 開発

### ローカル開発サーバー

#### フロントエンド

```bash
cd public
npm start
```

→ http://localhost:3000 で起動

#### バックエンド (Firebase Emulator)

```bash
firebase emulators:start
```

→ Functions, Firestore, Hosting のエミュレーターが起動

### ビルド

#### フロントエンド

```bash
cd public
npm run build
```

#### バックエンド

```bash
cd functions
npm run build
```

## デプロイ

### 全体をデプロイ

```bash
# Firestoreルール、Functions、Hostingをすべてデプロイ
firebase deploy
```

### 個別にデプロイ

```bash
# Functionsのみ
firebase deploy --only functions

# Hostingのみ (フロントエンドを先にビルド)
cd public && npm run build && cd ..
firebase deploy --only hosting

# Firestoreルールのみ
firebase deploy --only firestore:rules
```

## 使い方

### LINE Bot (LIFF)

1. LINE アプリで Bot を友だち追加
2. トーク画面から以下のコマンドを送信:
   - `一覧` または `リスト`: 在庫のあるお菓子を表示
   - `消費 [お菓子名] [個数]`: お菓子を消費
   - `ヘルプ`: 使い方を表示

### Web管理画面

1. https://YOUR_PROJECT_ID.web.app/ にアクセス
2. 管理者アカウントでログイン
3. お菓子の追加・編集・削除
4. 消費履歴の確認
5. ユーザー管理

## 機能

### LINE Bot
- ✅ お菓子一覧表示
- ✅ お菓子の消費記録
- ✅ 在庫少量時の通知
- ✅ ユーザー自動登録

### Web管理画面
- ✅ お菓子の追加・編集・削除
- ✅ 在庫管理
- ✅ 消費履歴の閲覧
- ✅ ユーザー管理
- ✅ 管理者権限制御

## データベース構造

### users コレクション
```typescript
{
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### sweets コレクション
```typescript
{
  name: string;
  description: string;
  imageUrl: string;
  stock: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### consumptionHistory コレクション
```typescript
{
  sweetId: string;
  sweetName: string;
  userId: string;
  quantity: number;
  timestamp: Timestamp;
}
```

## トラブルシューティング

### デプロイエラー

```bash
# Firebaseにログインし直す
firebase login --reauth

# プロジェクトを選択し直す
firebase use --add
```

### CORS エラー

Cloud Functions のリージョンと Firebase Hosting のリージョンが一致していることを確認してください。

### LINE Bot が反応しない

1. Webhook URL が正しく設定されているか確認
2. Firebase Functions のログを確認: `firebase functions:log`
3. LINE Channel Secret と Access Token が正しく設定されているか確認

## ライセンス

MIT

## 作成者

研究室メンバー
