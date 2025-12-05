// Firebase設定
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyC2lAhkr62TXFbnAEEvoI-qD-gPAjSLlkY",
  authDomain: "tamaki-sweets.firebaseapp.com",
  projectId: "tamaki-sweets",
  storageBucket: "tamaki-sweets.firebasestorage.app",
  messagingSenderId: "294744762867",
  appId: "1:294744762867:web:6e97d35b43b03d6a914a86",
  measurementId: "G-SP11372FJS"
};

// LINE LIFF設定
export const liffId = process.env.REACT_APP_LIFF_ID || "YOUR_LIFF_ID";

// API Endpoint
const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID";
export const apiEndpoint = process.env.NODE_ENV === 'production'
  ? `https://asia-northeast2-tamaki-sweets.cloudfunctions.net/api`
  : `http://localhost:5001/${projectId}/us-central1/api`;

// createCustomToken API Endpoint
export const createCustomTokenUrl = process.env.NODE_ENV === 'production'
  ? `https://asia-northeast2-tamaki-sweets.cloudfunctions.net/createCustomToken`
  : `http://localhost:5001/${projectId}/asia-northeast2/createCustomToken`;

// eatCandy API Endpoint
export const eatCandyUrl = process.env.NODE_ENV === 'production'
  ? `https://asia-northeast2-tamaki-sweets.cloudfunctions.net/eatCandy`
  : `http://localhost:5001/${projectId}/asia-northeast2/eatCandy`;
