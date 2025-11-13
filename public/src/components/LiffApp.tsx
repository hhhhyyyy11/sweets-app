import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Sweet } from '../types';

const LiffApp: React.FC = () => {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    initializeLiff();
  }, []);

  const initializeLiff = async () => {
    try {
      // LINEログイン確認
      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      // プロフィール取得
      const userProfile = await liff.getProfile();
      setProfile(userProfile);

      // お菓子一覧取得
      await fetchSweets();
    } catch (error) {
      console.error('LIFF initialization failed', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSweets = async () => {
    try {
      const sweetsRef = collection(db, 'sweets');
      const q = query(
        sweetsRef,
        where('stock', '>', 0),
        orderBy('stock', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const sweetsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Sweet));

      setSweets(sweetsData);
    } catch (error) {
      console.error('Error fetching sweets:', error);
    }
  };

  const handleSendMessage = (sweetName: string) => {
    if (liff.isInClient()) {
      liff.sendMessages([
        {
          type: 'text',
          text: `消費 ${sweetName} 1`
        }
      ]).then(() => {
        liff.closeWindow();
      });
    }
  };

  if (loading) {
    return (
      <div className="liff-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="liff-container">
      <div className="liff-header">
        <h1>🍭 お菓子一覧</h1>
        {profile && (
          <div className="user-info">
            <img src={profile.pictureUrl} alt={profile.displayName} />
            <span>{profile.displayName}</span>
          </div>
        )}
      </div>

      <div className="sweets-grid">
        {sweets.length === 0 ? (
          <div className="empty-state">
            <p>現在、在庫のあるお菓子はありません</p>
          </div>
        ) : (
          sweets.map(sweet => (
            <div key={sweet.id} className="sweet-card">
              {sweet.imageUrl && (
                <div className="sweet-image">
                  <img src={sweet.imageUrl} alt={sweet.name} />
                </div>
              )}
              <div className="sweet-info">
                <h3>{sweet.name}</h3>
                {sweet.description && <p className="description">{sweet.description}</p>}
                <div className="stock-info">
                  <span className="stock-badge">在庫: {sweet.stock}個</span>
                </div>
              </div>
              <button
                className="consume-btn"
                onClick={() => handleSendMessage(sweet.name)}
              >
                消費する
              </button>
            </div>
          ))
        )}
      </div>

      <div className="liff-footer">
        <p>タップして消費メッセージを送信</p>
      </div>
    </div>
  );
};

export default LiffApp;
