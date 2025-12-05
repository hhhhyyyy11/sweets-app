import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase設定オブジェクト
// 注: 以下の値は実際のFirebaseプロジェクトの設定に置き換えてください
export const firebaseConfig = {
  apiKey: "AIzaSyC2lAhkr62TXFbnAEEvoI-qD-gPAjSLlkY",
  authDomain: "tamaki-sweets.firebaseapp.com",
  projectId: "tamaki-sweets",
  storageBucket: "tamaki-sweets.firebasestorage.app",
  messagingSenderId: "294744762867",
  appId: "1:294744762867:web:6e97d35b43b03d6a914a86",
  measurementId: "G-SP11372FJS"
};

// Firebase初期化
const app: FirebaseApp = initializeApp(firebaseConfig);

// Firebase Authenticationサービス初期化
export const auth: Auth = getAuth(app);

// Cloud Firestoreサービス初期化
export const db: Firestore = getFirestore(app);

// デフォルトエクスポート
export default app;
