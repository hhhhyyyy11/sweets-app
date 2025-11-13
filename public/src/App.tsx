import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import liff from '@line/liff';
import axios from 'axios';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithCustomToken, User as FirebaseUser } from 'firebase/auth';
import { liffId, createCustomTokenUrl } from './config';

// Components
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiff, setIsLiff] = useState(false);
  const [error, setError] = useState<string>('');
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);

  const initializeApp = useCallback(async () => {
    try {
      // LIFF初期化
      await liff.init({ liffId });

      if (liff.isInClient()) {
        console.log('Running in LIFF environment');
        setIsLiff(true);

        // LIFFログイン処理
        await handleLiffLogin();
      } else {
        console.log('Running in Web environment');
        // Web環境の場合は通常のFirebase認証監視
        setupFirebaseAuthListener();
      }
    } catch (error) {
      console.error('LIFF initialization failed:', error);
      setError('初期化に失敗しました');
      setLoading(false);

      // LIFF環境でない場合は通常のWeb環境として処理
      setupFirebaseAuthListener();
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const handleLiffLogin = async () => {
    try {
      // 1. LINEログインチェック
      if (!liff.isLoggedIn()) {
        console.log('Not logged in to LINE, redirecting to login...');
        liff.login();
        return;
      }

      console.log('Logged in to LINE');

      // 2. LINE IDトークン取得
      const idToken = liff.getIDToken();

      if (!idToken) {
        throw new Error('Failed to get LINE ID token');
      }

      console.log('LINE ID token obtained');

      // 3. LINEプロフィール取得
      const profile = await liff.getProfile();
      setLiffProfile(profile);
      console.log('LINE profile:', profile);

      // 4. createCustomToken APIを呼び出し
      console.log('Requesting Firebase custom token...');
      const response = await axios.post(createCustomTokenUrl, {
        idToken: idToken,
      });

      const { firebaseToken, user: userData } = response.data;
      console.log('Firebase custom token received');
      console.log('User data:', userData);

      // 5. Firebaseにサインイン
      console.log('Signing in to Firebase...');
      const userCredential = await signInWithCustomToken(auth, firebaseToken);

      console.log('Successfully signed in to Firebase!');
      console.log('Firebase User UID:', userCredential.user.uid);

      setUser(userCredential.user);
      setLoading(false);

    } catch (error: any) {
      console.error('LIFF login error:', error);

      let errorMessage = 'ログインに失敗しました';

      if (error.response) {
        // API エラー
        errorMessage = error.response.data?.error || 'サーバーエラーが発生しました';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const setupFirebaseAuthListener = () => {
    // Firebase認証状態監視
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>読み込み中...</p>
        {liffProfile && (
          <div className="loading-profile">
            <p>ログイン中: {liffProfile.displayName}</p>
          </div>
        )}
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h2>⚠️ エラー</h2>
          <p className="error-message">{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setError('');
              setLoading(true);
              initializeApp();
            }}
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // LIFF環境の場合
  if (isLiff) {
    if (!user) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>認証中...</p>
        </div>
      );
    }
    return <UserDashboard />;
  }

  // Web環境の場合
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/admin" />} />
          <Route
            path="/admin/*"
            element={user ? <AdminDashboard /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to={user ? "/admin" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
