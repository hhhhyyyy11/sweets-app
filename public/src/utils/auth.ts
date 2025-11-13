/**
 * LINE IDトークンを使用してFirebaseにログインする
 *
 * このファイルは、createCustomToken APIの使用例です。
 * 実際のLIFFアプリやWeb認証フローで使用してください。
 */

import liff from '@line/liff';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * createCustomToken APIのエンドポイント
 * 本番環境では実際のURLに置き換えてください
 */
const CREATE_CUSTOM_TOKEN_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://asia-northeast2-YOUR_PROJECT_ID.cloudfunctions.net/createCustomToken'
    : 'http://localhost:5001/YOUR_PROJECT_ID/asia-northeast2/createCustomToken';

/**
 * LIFFを使用してLINEログインし、Firebaseにサインインする
 *
 * @returns Promise<User> - Firebaseユーザーオブジェクト
 * @throws Error - 認証に失敗した場合
 */
export const loginWithLINE = async () => {
  try {
    // 1. LIFFの初期化確認
    if (!liff.isLoggedIn()) {
      console.log('LINE not logged in, redirecting to login...');
      liff.login();
      throw new Error('LINE login required');
    }

    // 2. LINEのIDトークンを取得
    console.log('Getting LINE ID token...');
    const idToken = liff.getIDToken();

    if (!idToken) {
      throw new Error('Failed to get LINE ID token');
    }

    // 3. createCustomToken APIを呼び出してFirebaseカスタムトークンを取得
    console.log('Requesting Firebase custom token...');
    const response = await fetch(CREATE_CUSTOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('createCustomToken API error:', error);
      throw new Error(error.error || 'Failed to create custom token');
    }

    const data = await response.json();
    const { firebaseToken, user } = data;

    console.log('Firebase custom token received');
    console.log('User info:', user);

    // 4. Firebaseカスタムトークンでサインイン
    console.log('Signing in to Firebase...');
    const userCredential = await signInWithCustomToken(auth, firebaseToken);

    console.log('Successfully signed in to Firebase!');
    console.log('Firebase User UID:', userCredential.user.uid);

    return userCredential.user;
  } catch (error) {
    console.error('Error in loginWithLINE:', error);
    throw error;
  }
};

/**
 * 通常のWeb環境でLINE Loginを使用する場合の例
 * （LIFF以外の環境）
 *
 * @param idToken - LINE Login SDKから取得したIDトークン
 * @returns Promise<User> - Firebaseユーザーオブジェクト
 */
export const loginWithLINEWeb = async (idToken: string) => {
  try {
    if (!idToken) {
      throw new Error('ID token is required');
    }

    // createCustomToken APIを呼び出し
    console.log('Requesting Firebase custom token...');
    const response = await fetch(CREATE_CUSTOM_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create custom token');
    }

    const data = await response.json();
    const { firebaseToken } = data;

    // Firebaseにサインイン
    const userCredential = await signInWithCustomToken(auth, firebaseToken);

    console.log('Successfully signed in to Firebase!');
    return userCredential.user;
  } catch (error) {
    console.error('Error in loginWithLINEWeb:', error);
    throw error;
  }
};

/**
 * ログアウト処理
 */
export const logout = async () => {
  try {
    // Firebaseからサインアウト
    await auth.signOut();

    // LIFFからもログアウト（LIFF環境の場合）
    if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
      liff.logout();
    }

    console.log('Logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};
