/**
 * Firestore 初期データセットアップスクリプト
 *
 * 使用方法:
 * 1. このファイルを functions/src/setup.ts に配置
 * 2. functions/src/index.ts から export する
 * 3. firebase deploy --only functions:setupInitialData
 * 4. Cloud Functions コンソールまたはCLIから実行
 *
 * 注意: このスクリプトは初回のみ実行してください
 */

import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// グローバル設定
setGlobalOptions({ region: "asia-northeast1" });

/**
 * 初期データをセットアップする Cloud Function
 *
 * HTTPトリガーで実行可能（セキュリティのため本番では削除推奨）
 */
export const setupInitialData = onRequest(async (req, res) => {
  // POSTリクエストのみ受け付け
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // 簡易的な認証（本番環境では削除または強化してください）
  const { secret } = req.body;
  const expectedSecret = process.env.SETUP_SECRET || 'SETUP_SECRET_KEY';

  if (secret !== expectedSecret) {
    res.status(401).send('Unauthorized');
    return;
  }

  try {
    const db = admin.firestore();

      // ============================
      // サンプルお菓子データ
      // ============================
      const candies = [
        {
          name: 'ポテトチップス',
          description: '塩味のクラシックなポテトチップス',
          imageUrl: 'https://via.placeholder.com/300x200?text=Potato+Chips',
          price: 100,
          stock: 15,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: 'チョコレート',
          description: 'ミルクチョコレート',
          imageUrl: 'https://via.placeholder.com/300x200?text=Chocolate',
          price: 150,
          stock: 10,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: 'クッキー',
          description: 'バタークッキー（5枚入り）',
          imageUrl: 'https://via.placeholder.com/300x200?text=Cookies',
          price: 120,
          stock: 8,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: 'グミ',
          description: 'フルーツグミ',
          imageUrl: 'https://via.placeholder.com/300x200?text=Gummy',
          price: 80,
          stock: 20,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        {
          name: 'せんべい',
          description: '醤油せんべい',
          imageUrl: 'https://via.placeholder.com/300x200?text=Rice+Cracker',
          price: 90,
          stock: 12,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      ];

      console.log('Adding sample candies...');
      const candyPromises = candies.map(candy =>
        db.collection('candies').add(candy)
      );
      await Promise.all(candyPromises);
      console.log(`✅ Added ${candies.length} candies`);

      // ============================
      // 既存データの確認
      // ============================

      // usersコレクションの確認
      const usersSnapshot = await db.collection('users').limit(1).get();
      const userCount = usersSnapshot.size;

      // candiesコレクションの確認
      const candiesSnapshot = await db.collection('candies').get();
      const candyCount = candiesSnapshot.size;

      res.status(200).json({
        success: true,
        message: 'Initial data setup completed',
        stats: {
          users: userCount,
          candies: candyCount,
        },
        note: 'Please create admin user manually in Firebase Console',
      });

    } catch (error: any) {
      console.error('Error setting up initial data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to setup initial data',
        details: error.message,
      });
    }
  });

/**
 * データベースをリセットする Cloud Function（開発環境専用）
 *
 * ⚠️ 警告: 全データが削除されます。本番環境では絶対に使用しないでください
 */
export const resetDatabase = onRequest(async (req, res) => {
  // 環境チェック
  if (process.env.FUNCTIONS_EMULATOR !== 'true') {
    res.status(403).send('This function can only be run in emulator');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const db = admin.firestore();

    // 全コレクションを削除
    const collections = ['users', 'candies', 'eatingHistory', 'requests', 'sweets', 'consumptionHistory', 'stockHistory'];

    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      const batch = db.batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Deleted ${snapshot.size} documents from ${collectionName}`);
    }

    res.status(200).json({
      success: true,
      message: 'Database reset completed',
      deletedCollections: collections,
    });

  } catch (error: any) {
    console.error('Error resetting database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset database',
      details: error.message,
    });
  }
});

/**
 * sweetsコレクションからcandiesコレクションへのデータ移行
 */
export const migrateFromSweetsToCandies = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
    }

    try {
      const db = admin.firestore();

      // sweetsコレクションから全データ取得
      const sweetsSnapshot = await db.collection('sweets').get();

      if (sweetsSnapshot.empty) {
        res.status(200).json({
          success: true,
          message: 'No data to migrate',
          migrated: 0,
        });
        return;
      }

      let migratedCount = 0;

      for (const sweetDoc of sweetsSnapshot.docs) {
        const sweet = sweetDoc.data();

        // candiesコレクションに新規作成
        await db.collection('candies').add({
          name: sweet.name || '',
          description: sweet.description || '',
          imageUrl: sweet.imageUrl || '',
          price: 0,  // 既存データにpriceがないため0に設定（後で手動更新が必要）
          stock: sweet.stock || 0,
          isActive: true,
          createdAt: sweet.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        migratedCount++;
      }

      res.status(200).json({
        success: true,
        message: 'Migration completed',
        migrated: migratedCount,
        note: 'Please update price fields manually for migrated candies',
      });

    } catch (error: any) {
      console.error('Error migrating data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to migrate data',
        details: error.message,
      });
    }
  });
