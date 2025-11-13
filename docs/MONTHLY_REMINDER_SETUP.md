# 月次集計リマインダー セットアップガイド

このドキュメントでは、月次集計リマインダー機能の設定と動作について説明します。

## 概要

`monthlyReminder`関数は、毎月1日の午前0時（日本時間）に自動実行され、未払いのあるユーザーにLINEでプッシュ通知を送信します。

## 機能仕様

### 実行スケジュール

- **実行頻度**: 毎月1日
- **実行時刻**: 午前0時（日本時間）
- **タイムゾーン**: Asia/Tokyo
- **Cron式**: `0 0 1 * *`

### 処理フロー

1. **ユーザー取得**: `users`コレクションから全ユーザーを取得
2. **未払いユーザー抽出**: `currentBalance > 0`のユーザーを抽出
3. **プッシュ通知送信**: 各ユーザーにLINEでメッセージを送信
4. **管理者通知**: 送信結果を管理者に通知

### 送信されるメッセージ

#### ユーザー向けメッセージ

```
📊 月次集計のお知らせ

[ユーザー名]さん
今月の未払い額は [金額]円 です。

お支払いをお願いいたします。
```

#### 管理者向けメッセージ

```
📊 月次リマインダー送信完了

✅ 送信成功: [件数]件
❌ 送信失敗: [件数]件
💰 未払い総額: ¥[金額]

詳細は管理画面でご確認ください。
```

## セットアップ手順

### 1. 前提条件

以下の設定が完了していることを確認してください:

- LINE Bot (Messaging API) の設定
- Firebase Functions Config の設定
  - `line.channel_access_token`
  - `line.channel_secret`

### 2. 関数のデプロイ

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:monthlyReminder
```

### 3. デプロイ確認

デプロイが成功すると、以下のようなメッセージが表示されます:

```
✔  functions[asia-northeast1-monthlyReminder]: Successful create operation.
```

### 4. Cloud Schedulerの確認

Google Cloud Consoleで確認:

1. [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler)にアクセス
2. プロジェクトを選択
3. `firebase-schedule-monthlyReminder-asia-northeast1`というジョブが作成されていることを確認

## 動作確認

### 手動実行でのテスト

Cloud Schedulerから手動で実行してテストできます:

#### 方法1: Google Cloud Console

1. Cloud Schedulerのページを開く
2. `firebase-schedule-monthlyReminder-asia-northeast1`を選択
3. 「今すぐ実行」をクリック

#### 方法2: gcloud CLI

```bash
gcloud scheduler jobs run firebase-schedule-monthlyReminder-asia-northeast1 \
  --location=asia-northeast1 \
  --project=YOUR_PROJECT_ID
```

### ログの確認

Firebase Consoleまたはgcloud CLIでログを確認:

```bash
firebase functions:log --only monthlyReminder
```

期待されるログ出力:

```
Monthly reminder started
Total users: 10
Unpaid users found: 3
Reminder sent to 田中太郎 (¥500)
Reminder sent to 佐藤花子 (¥300)
Reminder sent to 鈴木一郎 (¥200)
Monthly reminder completed
Success: 3, Failure: 0
Total unpaid amount: ¥1000
Admin notification sent to 管理者
```

## スケジュール変更

実行スケジュールを変更したい場合は、`index.ts`の以下の部分を修正してください:

### 例1: 毎月末日（月初ではなく）

```typescript
.pubsub.schedule("0 0 28-31 * *") // 月末に実行
```

### 例2: 毎月15日

```typescript
.pubsub.schedule("0 0 15 * *") // 毎月15日に実行
```

### 例3: 毎週月曜日

```typescript
.pubsub.schedule("0 0 * * 1") // 毎週月曜日に実行
```

### 例4: 毎日午前9時

```typescript
.pubsub.schedule("0 0 * * *") // 毎日午前0時に実行
```

変更後は再デプロイが必要です:

```bash
firebase deploy --only functions:monthlyReminder
```

## トラブルシューティング

### ユーザーに通知が届かない

**原因1**: LINE User IDが正しく保存されていない

**確認方法**:
```bash
# Firestoreでusersコレクションを確認
# lineUserIdフィールドが存在するか確認
```

**対処法**:
- ユーザーがLIFF経由でログインしていることを確認
- `createCustomToken`関数でlineUserIdが保存されていることを確認

**原因2**: Channel Access Tokenが無効

**確認方法**:
```bash
firebase functions:config:get
```

**対処法**:
- LINE Developersコンソールで新しいトークンを発行
- Firebase Functions Configを更新
- 関数を再デプロイ

### 管理者に通知が届かない

**原因**: 管理者の`role`が正しく設定されていない

**確認方法**:
Firestoreで管理者ユーザーの`role`フィールドが`"admin"`になっているか確認

**対処法**:
```javascript
// Firestoreで直接更新
users/{userId}: {
  role: "admin"
}
```

### スケジュール実行されない

**原因1**: Cloud Schedulerが有効化されていない

**対処法**:
1. Google Cloud Consoleで[Cloud Scheduler API](https://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com)を有効化
2. 関数を再デプロイ

**原因2**: タイムゾーンの設定ミス

**確認方法**:
Cloud Schedulerのジョブ詳細でタイムゾーンを確認

**対処法**:
- `index.ts`で`.timeZone("Asia/Tokyo")`が設定されているか確認
- 再デプロイ

### 料金に関する注意

Cloud Schedulerは以下の料金がかかります:

- **無料枠**: 月3ジョブまで無料
- **有料**: 月4ジョブ目以降、1ジョブあたり$0.10/月

この実装では1ジョブのみ使用するため、無料枠内で動作します。

詳細: [Cloud Scheduler 料金](https://cloud.google.com/scheduler/pricing)

## カスタマイズ

### メッセージ内容のカスタマイズ

`index.ts`の以下の部分を編集してメッセージをカスタマイズできます:

```typescript
const message = `📊 月次集計のお知らせ\n\n${user.displayName}さん\n今月の未払い額は ${user.currentBalance}円 です。\n\nお支払いをお願いいたします。`;
```

### 条件のカスタマイズ

未払い額の閾値を設定する例:

```typescript
// 100円以上の未払いがある場合のみ通知
if (currentBalance >= 100 && userData.lineUserId) {
  unpaidUsers.push({
    // ...
  });
}
```

### リッチメッセージの使用

LINE Flexメッセージを使用してリッチな通知を送る例:

```typescript
await lineClient.pushMessage(user.lineUserId, {
  type: "flex",
  altText: "月次集計のお知らせ",
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "月次集計のお知らせ",
          weight: "bold",
          size: "xl"
        },
        {
          type: "text",
          text: `未払い額: ¥${user.currentBalance}`,
          size: "lg",
          color: "#FF0000"
        }
      ]
    }
  }
});
```

## 監視とアラート

### Cloud Loggingでの監視

ログベースのメトリクスを作成して、送信失敗を監視:

1. Cloud Consoleで「ログベースのメトリクス」を開く
2. 新しいメトリクスを作成
3. フィルタ: `resource.type="cloud_function" AND resource.labels.function_name="monthlyReminder" AND "Error sending reminder"`
4. アラートポリシーを設定

### 送信失敗時の再試行

現在の実装では、送信失敗したユーザーは記録されますが自動再試行はされません。

必要に応じて、以下のような再試行ロジックを追加できます:

```typescript
// 失敗したユーザーをFirestoreに記録
const failedUsers = results.filter(r => !r.success);
if (failedUsers.length > 0) {
  await db.collection("reminderFailures").add({
    date: admin.firestore.FieldValue.serverTimestamp(),
    failedUsers: failedUsers,
  });
}
```

## ベストプラクティス

1. **テスト環境での確認**: 本番環境にデプロイする前に、テスト用のスケジュール（例: 毎日実行）で動作確認
2. **ログの監視**: 定期的にログを確認し、エラーがないかチェック
3. **ユーザーへの事前通知**: 月次リマインダー機能を開始する際は、ユーザーに事前に通知
4. **オプトアウト機能**: 必要に応じて、通知を受け取らない設定を追加

## 関連ドキュメント

- [Firebase Cloud Functions - スケジュール関数](https://firebase.google.com/docs/functions/schedule-functions)
- [Cloud Scheduler ドキュメント](https://cloud.google.com/scheduler/docs)
- [LINE Messaging API - Push Message](https://developers.line.biz/ja/reference/messaging-api/#send-push-message)
- [Cron式の書き方](https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules)

## サポート

問題が発生した場合は、以下を確認してください:

1. Firebase Functions のログ
2. Cloud Scheduler のジョブ履歴
3. LINE Developersコンソールの統計情報
4. Firestoreのusersコレクションのデータ構造
