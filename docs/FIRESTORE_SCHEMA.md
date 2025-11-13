# Firestore データベース構造ガイド

## 📊 コレクション一覧

### 1. users
**DocID**: LINE User ID

ユーザー情報を管理します。

| フィールド | 型 | 必須 | 説明 | 例 |
|-----------|-----|------|------|-----|
| lineUserId | string | ✅ | LINEユーザーID | "U1234567890abcdef" |
| displayName | string | ✅ | 表示名 | "田中太郎" |
| pictureUrl | string | | プロフィール画像URL | "https://..." |
| email | string | | メールアドレス | "tanaka@example.com" |
| role | string | ✅ | 権限 | "admin" or "user" |
| currentBalance | number | ✅ | 未払い額（負の値） | -500 |
| createdAt | Timestamp | ✅ | 作成日時 | |
| updatedAt | Timestamp | ✅ | 更新日時 | |

**セキュリティルール**:
- 読み取り: 全認証済みユーザー
- 作成: 本人のみ
- 更新: 本人（roleフィールド除く）または管理者
- 削除: 管理者のみ

---

### 2. candies
**DocID**: 自動生成

お菓子マスタ情報を管理します。

| フィールド | 型 | 必須 | 説明 | 例 |
|-----------|-----|------|------|-----|
| name | string | ✅ | お菓子名 | "ポテトチップス" |
| description | string | | 説明 | "塩味" |
| imageUrl | string | | 画像URL | "https://..." |
| price | number | ✅ | 価格 | 100 |
| stock | number | ✅ | 在庫数 | 10 |
| isActive | boolean | ✅ | 有効/無効 | true |
| createdAt | Timestamp | ✅ | 作成日時 | |
| updatedAt | Timestamp | ✅ | 更新日時 | |

**セキュリティルール**:
- 読み取り: 全認証済みユーザー
- 作成/更新/削除: 管理者のみ

---

### 3. eatingHistory
**DocID**: 自動生成

お菓子の消費履歴を管理します。

| フィールド | 型 | 必須 | 説明 | 例 |
|-----------|-----|------|------|-----|
| userId | string | ✅ | ユーザーID（usersのDocID） | "U1234567890abcdef" |
| candyId | string | ✅ | お菓子ID（candiesのDocID） | "abc123" |
| candyName | string | ✅ | お菓子名（スナップショット） | "ポテトチップス" |
| quantity | number | ✅ | 消費数量 | 2 |
| priceAtTime | number | ✅ | 消費時の価格 | 100 |
| timestamp | Timestamp | ✅ | 消費日時 | |

**セキュリティルール**:
- 読み取り: 全認証済みユーザー
- 作成: 認証済みユーザー（自分のuserIdのみ）
- 更新/削除: 管理者のみ

---

### 4. requests
**DocID**: 自動生成

お菓子のリクエストを管理します。

| フィールド | 型 | 必須 | 説明 | 例 |
|-----------|-----|------|------|-----|
| userId | string | ✅ | ユーザーID（usersのDocID） | "U1234567890abcdef" |
| candyName | string | ✅ | リクエストするお菓子名 | "じゃがりこ" |
| description | string | | 説明・理由 | "サラダ味が好きです" |
| status | string | ✅ | ステータス | "requested", "purchased", "rejected" |
| timestamp | Timestamp | ✅ | リクエスト日時 | |
| processedAt | Timestamp | | 処理日時 | |
| processedBy | string | | 処理者のuserId | "U0987654321fedcba" |

**セキュリティルール**:
- 読み取り: 全認証済みユーザー
- 作成: 認証済みユーザー（自分のuserIdのみ、status='requested'のみ）
- 更新: 本人（status='requested'のみ）または管理者
- 削除: 本人または管理者

---

## 🔐 セキュリティルール概要

### 認証
すべてのコレクションは **認証済みユーザーのみ** がアクセス可能です。

```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

### 管理者権限
`users` コレクションの `role` フィールドが `'admin'` のユーザーは管理者権限を持ちます。

```javascript
function isAdmin() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

### 本人確認
ドキュメントのオーナーかどうかをチェックします。

```javascript
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}
```

---

## 📝 初期データのセットアップ

### 方法1: Firebase Consoleから手動追加

#### 1. 管理者ユーザーの作成

1. Firebase Console > Authentication でユーザーを作成
2. UIDをコピー
3. Firestore > users コレクション > ドキュメントを追加

```json
// DocID: <AuthenticationのUID>
{
  "lineUserId": "<LINEのユーザーID>",
  "displayName": "管理者",
  "pictureUrl": "",
  "email": "admin@example.com",
  "role": "admin",
  "currentBalance": 0,
  "createdAt": <Timestamp>,
  "updatedAt": <Timestamp>
}
```

#### 2. サンプルお菓子の追加

Firestore > candies コレクション > ドキュメントを追加

```json
{
  "name": "ポテトチップス",
  "description": "塩味",
  "imageUrl": "https://example.com/potato-chips.jpg",
  "price": 100,
  "stock": 10,
  "isActive": true,
  "createdAt": <Timestamp>,
  "updatedAt": <Timestamp>
}
```

```json
{
  "name": "チョコレート",
  "description": "ミルクチョコ",
  "imageUrl": "https://example.com/chocolate.jpg",
  "price": 150,
  "stock": 5,
  "isActive": true,
  "createdAt": <Timestamp>,
  "updatedAt": <Timestamp>
}
```

### 方法2: Cloud Functions（推奨）

初期データセットアップ用のCloud Functionを作成できます。

```typescript
// functions/src/setup.ts
import * as admin from 'firebase-admin';

export async function setupInitialData() {
  const db = admin.firestore();
  
  // サンプルお菓子を追加
  const candies = [
    {
      name: 'ポテトチップス',
      description: '塩味',
      imageUrl: '',
      price: 100,
      stock: 10,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: 'チョコレート',
      description: 'ミルクチョコ',
      imageUrl: '',
      price: 150,
      stock: 5,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];
  
  for (const candy of candies) {
    await db.collection('candies').add(candy);
  }
  
  console.log('Initial data setup completed');
}
```

---

## 🔄 データ移行

既存の `sweets` コレクションから `candies` コレクションへの移行手順:

### 移行スクリプト例

```typescript
async function migrateFromSweetsToCandies() {
  const db = admin.firestore();
  
  // sweetsコレクションから全データ取得
  const sweetsSnapshot = await db.collection('sweets').get();
  
  for (const sweetDoc of sweetsSnapshot.docs) {
    const sweet = sweetDoc.data();
    
    // candiesコレクションに新規作成
    await db.collection('candies').doc(sweetDoc.id).set({
      name: sweet.name,
      description: sweet.description || '',
      imageUrl: sweet.imageUrl || '',
      price: sweet.price || 0,  // 既存データにpriceがない場合は0
      stock: sweet.stock,
      isActive: true,
      createdAt: sweet.createdAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  console.log('Migration completed');
}
```

### 移行時の注意点

1. ✅ 既存の `sweets` コレクションは残しておく（後方互換性）
2. ✅ 新機能は `candies` コレクションを使用
3. ✅ 段階的に移行を進める
4. ⚠️ 本番環境での移行前に必ずバックアップを取得

---

## 📊 クエリ例

### ユーザーの未払い額を取得

```typescript
const userDoc = await db.collection('users').doc(userId).get();
const currentBalance = userDoc.data()?.currentBalance || 0;
```

### 在庫のあるお菓子を取得

```typescript
const candiesSnapshot = await db.collection('candies')
  .where('isActive', '==', true)
  .where('stock', '>', 0)
  .orderBy('stock', 'desc')
  .get();
```

### ユーザーの消費履歴を取得

```typescript
const historySnapshot = await db.collection('eatingHistory')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(20)
  .get();
```

### 未処理のリクエストを取得

```typescript
const requestsSnapshot = await db.collection('requests')
  .where('status', '==', 'requested')
  .orderBy('timestamp', 'desc')
  .get();
```

### ユーザーの合計消費額を計算

```typescript
const historySnapshot = await db.collection('eatingHistory')
  .where('userId', '==', userId)
  .get();

let totalAmount = 0;
historySnapshot.forEach(doc => {
  const data = doc.data();
  totalAmount += data.priceAtTime * data.quantity;
});
```

---

## 🔧 メンテナンス

### インデックスのデプロイ

```bash
firebase deploy --only firestore:indexes
```

### セキュリティルールのデプロイ

```bash
firebase deploy --only firestore:rules
```

### セキュリティルールのテスト

```bash
firebase emulators:start
# 別のターミナルで
npm install -g @firebase/rules-unit-testing
# テストスクリプトを実行
```

---

## 📚 参考リンク

- [Firestore セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore データモデリング](https://firebase.google.com/docs/firestore/data-model)
- [Firestore インデックス](https://firebase.google.com/docs/firestore/query-data/indexing)
