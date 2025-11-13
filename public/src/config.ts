// Firebase設定
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// LINE LIFF設定
export const liffId = "YOUR_LIFF_ID";

// API Endpoint
export const apiEndpoint = process.env.NODE_ENV === 'production'
  ? "https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/api"
  : "http://localhost:5001/YOUR_PROJECT_ID/us-central1/api";

// createCustomToken API Endpoint
export const createCustomTokenUrl = process.env.NODE_ENV === 'production'
  ? "https://asia-northeast1-YOUR_PROJECT_ID.cloudfunctions.net/createCustomToken"
  : "http://localhost:5001/YOUR_PROJECT_ID/asia-northeast1/createCustomToken";

// eatCandy API Endpoint
export const eatCandyUrl = process.env.NODE_ENV === 'production'
  ? "https://asia-northeast1-YOUR_PROJECT_ID.cloudfunctions.net/eatCandy"
  : "http://localhost:5001/YOUR_PROJECT_ID/asia-northeast1/eatCandy";
