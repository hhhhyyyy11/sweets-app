# クイックスタートガイド

研究室お菓子管理アプリの最速セットアップガイドです。

## 🚀 5ステップでセットアップ

### ステップ1️⃣: Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) で新規プロジェクトを作成
2. 以下のサービスを有効化:
   - ✅ Authentication (Email/Password、カスタム認証)
   - ✅ Firestore Database
   - ✅ Hosting
   - ✅ Functions

### ステップ2️⃣: LINE Developers の設定

1. [LINE Developers Console](https://developers.line.biz/console/) でプロバイダーを作成

2. **LINE Login チャネル**を作成（認証用）
   - チャネルIDをメモ → これが `LINE_LOGIN_CHANNEL_ID`
   - コールバックURL: `https://YOUR_PROJECT_ID.web.app/`

3. **Messaging API チャネル**を作成（Bot用）
   - Channel Access Token をメモ
   - Channel Secret をメモ
   - Webhook URL: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/lineWebhook`

4. **LIFF アプリ**を作成（LINE Loginチャネル内）
   - Endpoint URL: `https://YOUR_PROJECT_ID.web.app/`
   - Size: Full
   - Scope: `profile`, `openid`, `email`
   - LIFF ID をメモ

### ステップ3️⃣: プロジェクトの設定

```bash
# リポジトリをクローン
git clone <YOUR_REPOSITORY_URL>
cd sweets-app

# Firebaseプロジェクトを設定
firebase login
# .firebasercファイルを編集してプロジェクトIDを設定

# フロントエンドの環境変数を設定
cd public
cp .env.example .env
# .envファイルを編集（下記参照）

# バックエンドの環境変数を設定
cd ../functions
firebase functions:config:set \
  line.login_channel_id="YOUR_LINE_LOGIN_CHANNEL_ID" \
  line.channel_access_token="YOUR_CHANNEL_ACCESS_TOKEN" \
  line.channel_secret="YOUR_CHANNEL_SECRET"
```

#### 📝 .env ファイルの設定

`public/.env` を編集:

```bash
# Firebase設定（Firebase Console > プロジェクト設定 > マイアプリから取得）
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123

# LINE LIFF ID
REACT_APP_LIFF_ID=1234567890-abcdefgh
```

#### 📝 config.ts の更新

`public/src/config.ts` の `YOUR_PROJECT_ID` を実際のプロジェクトIDに置き換え:

```typescript
export const createCustomTokenUrl = process.env.NODE_ENV === 'production'
  ? "https://asia-northeast2-YOUR_PROJECT_ID.cloudfunctions.net/createCustomToken"
  : "http://localhost:5001/YOUR_PROJECT_ID/asia-northeast2/createCustomToken";
```

### ステップ4️⃣: 依存関係のインストール

```bash
# フロントエンド
cd public
npm install

# バックエンド
cd ../functions
npm install
```

### ステップ5️⃣: デプロイ

```bash
# ルートディレクトリに戻る
cd ..

# Firestoreルールとインデックスをデプロイ
firebase deploy --only firestore

# Functionsをビルド＆デプロイ
cd functions
npm run build
cd ..
firebase deploy --only functions

# フロントエンドをビルド＆デプロイ
cd public
npm run build
cd ..
firebase deploy --only hosting
```

## ✅ 動作確認

### 1. Web管理画面

1. `https://YOUR_PROJECT_ID.web.app/` にアクセス
2. Firebase Consoleで管理者ユーザーを作成:
   - Authentication > ユーザーを追加
   - メール: `admin@example.com`
   - パスワード: 任意
3. Firestoreで管理者権限を付与:
   - `users` コレクションにドキュメントを追加
   - ドキュメントID: Authentication の UID
   - フィールド:
     ```json
     {
       "lineUserId": "",
       "displayName": "管理者",
       "pictureUrl": "",
       "email": "admin@example.com",
       "role": "admin",
       "createdAt": <Timestamp>,
       "updatedAt": <Timestamp>
     }
     ```
4. ログインして管理画面が表示されることを確認

### 2. LINE Bot

1. LINE アプリでBotを友だち追加
2. トークで「ヘルプ」と送信
3. Botから返信があることを確認

### 3. LIFF アプリ

1. LINEアプリで `https://liff.line.me/YOUR_LIFF_ID` を開く
2. 自動でLINEログイン → Firebase認証が実行される
3. お菓子一覧が表示される

## 🔧 ローカル開発

```bash
# Firebaseエミュレーターを起動（ターミナル1）
firebase emulators:start

# Reactアプリを起動（ターミナル2）
cd public
npm start
```

- Web管理画面: http://localhost:3000
- Functions: http://localhost:5001
- Firestore: http://localhost:8080

## 📚 次のステップ

### 管理画面コンポーネントの実装

以下のコンポーネントを実装する必要があります:

1. **SweetsManagement** - お菓子の追加・編集・削除
2. **ConsumptionHistory** - 消費履歴の表示
3. **UserManagement** - ユーザー管理

これらは `public/src/components/` ディレクトリに作成してください。

### お菓子の追加

Web管理画面から:

1. 「お菓子管理」タブを開く
2. 「新規追加」ボタンをクリック
3. 名前、説明、画像URL、在庫数を入力
4. 保存

### LINE Botでの消費

LINEトークから:

```
一覧
→ 在庫のあるお菓子を表示

消費 ポテトチップス 2
→ ポテトチップスを2個消費
```

## 🆘 トラブルシューティング

### デプロイエラー

```bash
# 再ログイン
firebase login --reauth

# プロジェクトを再選択
firebase use --add
```

### Functions エラー

```bash
# ログを確認
firebase functions:log

# 特定の関数のログ
firebase functions:log --only createCustomToken
```

### LIFF初期化エラー

1. LIFF IDが正しいか確認
2. Endpoint URLが正しいか確認
3. LIFFアプリが有効になっているか確認

### 認証エラー

1. LINE Login チャネルIDが正しく設定されているか確認:
   ```bash
   firebase functions:config:get
   ```

2. 環境変数を再設定:
   ```bash
   firebase functions:config:set line.login_channel_id="YOUR_CHANNEL_ID"
   firebase deploy --only functions
   ```

## 📖 詳細ドキュメント

- [README.md](../README.md) - プロジェクト全体の説明
- [API_CREATE_CUSTOM_TOKEN.md](./API_CREATE_CUSTOM_TOKEN.md) - createCustomToken API仕様
- [API_OVERVIEW.md](./API_OVERVIEW.md) - API全体の仕様
- [LIFF_AUTO_LOGIN.md](./LIFF_AUTO_LOGIN.md) - LIFF自動ログイン実装詳細
- [functions/ENVIRONMENT.md](../functions/ENVIRONMENT.md) - 環境変数設定ガイド

## 🎯 チェックリスト

デプロイ前に以下を確認:

- [ ] Firebase プロジェクトが作成されている
- [ ] LINE Login チャネルが作成されている
- [ ] Messaging API チャネルが作成されている
- [ ] LIFF アプリが作成されている
- [ ] `.env` ファイルが設定されている
- [ ] `config.ts` のプロジェクトIDが正しい
- [ ] Firebase Functions の環境変数が設定されている
- [ ] `npm install` が完了している
- [ ] Firestoreルールがデプロイされている
- [ ] Functions がデプロイされている
- [ ] Hosting がデプロイされている

## 🎉 完了!

これで研究室お菓子管理アプリのセットアップが完了しました!

お菓子を追加して、LINE Botから消費してみましょう 🍭
