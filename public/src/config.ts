// Firebase設定
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// LINE LIFF設定
export const liffId = process.env.REACT_APP_LIFF_ID || "YOUR_LIFF_ID";

// API Endpoint
const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID";
export const apiEndpoint = process.env.NODE_ENV === 'production'
  ? `https://asia-northeast1-${projectId}.cloudfunctions.net/api`
  : `http://localhost:5001/${projectId}/us-central1/api`;

// createCustomToken API Endpoint
export const createCustomTokenUrl = process.env.NODE_ENV === 'production'
  ? `https://asia-northeast1-${projectId}.cloudfunctions.net/createCustomToken`
  : `http://localhost:5001/${projectId}/asia-northeast1/createCustomToken`;

// eatCandy API Endpoint
export const eatCandyUrl = process.env.NODE_ENV === 'production'
  ? `https://asia-northeast1-${projectId}.cloudfunctions.net/eatCandy`
  : `http://localhost:5001/${projectId}/asia-northeast1/eatCandy`;
