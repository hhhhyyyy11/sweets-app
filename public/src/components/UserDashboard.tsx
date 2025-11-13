import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp, onSnapshot, doc } from 'firebase/firestore';
import axios from 'axios';
import { eatCandyUrl } from '../config';

interface Candy {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
}

interface EatingHistory {
  id: string;
  candyName: string;
  quantity: number;
  priceAtTime: number;
  timestamp: any;
}

interface UserData {
  displayName: string;
  currentBalance: number;
  pictureUrl: string;
}

interface Request {
  id: string;
  candyName: string;
  description: string;
  status: string;
  timestamp: any;
}

const UserDashboard: React.FC = () => {
  const [candies, setCandies] = useState<Candy[]>([]);
  const [history, setHistory] = useState<EatingHistory[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eatingLoading, setEatingLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // リクエストフォーム
  const [requestForm, setRequestForm] = useState({
    candyName: '',
    description: '',
  });
  const [showRequestForm, setShowRequestForm] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadCandies(),
        loadHistory(),
        loadUserData(),
        loadRequests(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // お菓子一覧を読み込む
  const loadCandies = async () => {
    const candiesRef = collection(db, 'candies');
    const q = query(
      candiesRef,
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const candiesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Candy));

    setCandies(candiesData);
  };

  // 消費履歴を読み込む
  const loadHistory = async () => {
    if (!currentUser) return;

    const historyRef = collection(db, 'eatingHistory');
    const q = query(
      historyRef,
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    // リアルタイム更新を監視
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EatingHistory));

      setHistory(historyData);
    });

    return unsubscribe;
  };

  // ユーザーデータを読み込む
  const loadUserData = async () => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);

    // リアルタイム更新を監視
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setUserData({
          displayName: data.displayName || 'User',
          currentBalance: data.currentBalance || 0,
          pictureUrl: data.pictureUrl || '',
        });
      }
    });

    return unsubscribe;
  };

  // リクエスト一覧を読み込む
  const loadRequests = async () => {
    if (!currentUser) return;

    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const requestsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Request));

    setRequests(requestsData);
  };

  // お菓子を消費する
  const handleEatCandy = async (candy: Candy) => {
    if (!currentUser) {
      setError('ログインが必要です');
      return;
    }

    setEatingLoading(candy.id);
    setError('');
    setSuccessMessage('');

    try {
      // Firebase ID トークンを取得
      const idToken = await currentUser.getIdToken();

      // eatCandy API を呼び出し
      const response = await axios.post(
        eatCandyUrl,
        { candyId: candy.id },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage(response.data.message);
        // データを再読み込み
        await Promise.all([loadCandies(), loadHistory(), loadUserData()]);
      }
    } catch (error: any) {
      console.error('Error eating candy:', error);

      if (error.response) {
        setError(error.response.data?.error || 'エラーが発生しました');
      } else {
        setError('通信エラーが発生しました');
      }
    } finally {
      setEatingLoading(null);
    }
  };

  // リクエストを送信
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setError('ログインが必要です');
      return;
    }

    if (!requestForm.candyName.trim()) {
      setError('お菓子名を入力してください');
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      await addDoc(collection(db, 'requests'), {
        userId: currentUser.uid,
        candyName: requestForm.candyName.trim(),
        description: requestForm.description.trim(),
        status: 'requested',
        timestamp: Timestamp.now(),
      });

      setSuccessMessage('リクエストを送信しました');
      setRequestForm({ candyName: '', description: '' });
      setShowRequestForm(false);
      await loadRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('リクエストの送信に失敗しました');
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ja-JP');
  };

  const formatPrice = (price: number) => {
    return `¥${price.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { text: string; className: string } } = {
      requested: { text: '申請中', className: 'bg-yellow-100 text-yellow-800' },
      purchased: { text: '購入済み', className: 'bg-green-100 text-green-800' },
      rejected: { text: '却下', className: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-primary to-secondary text-white p-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {userData?.pictureUrl && (
            <img
              src={userData.pictureUrl}
              alt={userData.displayName}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
            />
          )}
          <div>
            <h2 className="text-2xl font-semibold mb-1">{userData?.displayName || 'User'}</h2>
            <p className="text-lg font-medium">
              未払い額:
              <span className={`ml-2 font-bold ${userData && userData.currentBalance < 0 ? 'text-red-200' : ''}`}>
                {formatPrice(userData?.currentBalance || 0)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* メッセージ表示 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow">
            <p className="text-red-800 font-medium">❌ {error}</p>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow">
            <p className="text-green-800 font-medium">✅ {successMessage}</p>
          </div>
        )}

        {/* お菓子一覧 */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">🍭 お菓子一覧</h3>
          {candies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">現在、利用可能なお菓子がありません</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candies.map(candy => (
                <div key={candy.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  {candy.imageUrl && (
                    <div className="h-48 overflow-hidden bg-gray-100">
                      <img src={candy.imageUrl} alt={candy.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{candy.name}</h4>
                    {candy.description && <p className="text-sm text-gray-600 mb-3">{candy.description}</p>}
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold text-primary">{formatPrice(candy.price)}</span>
                      <span className={`text-sm font-medium ${candy.stock <= 5 ? 'text-red-600' : 'text-gray-600'}`}>
                        在庫: {candy.stock}個
                      </span>
                    </div>
                    <button
                      className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      onClick={() => handleEatCandy(candy)}
                      disabled={candy.stock === 0 || eatingLoading === candy.id}
                    >
                      {eatingLoading === candy.id ? '処理中...' : '食べた'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* リクエスト */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-800">📝 リクエスト</h3>
            <button
              className="bg-secondary hover:bg-opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              onClick={() => setShowRequestForm(!showRequestForm)}
            >
              {showRequestForm ? 'キャンセル' : '新しいリクエスト'}
            </button>
          </div>

          {showRequestForm && (
            <form onSubmit={handleSubmitRequest} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">お菓子名 *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={requestForm.candyName}
                  onChange={(e) => setRequestForm({ ...requestForm, candyName: e.target.value })}
                  placeholder="例: ポテトチップス のり塩"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">説明・理由</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  placeholder="リクエスト理由や補足情報があれば入力してください"
                  rows={3}
                />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                送信
              </button>
            </form>
          )}

          {requests.length > 0 && (
            <div className="space-y-3">
              {requests.map(request => (
                <div key={request.id} className="flex justify-between items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">{request.candyName}</h4>
                    {request.description && <p className="text-sm text-gray-600 mb-2">{request.description}</p>}
                    <span className="text-xs text-gray-500">{formatTimestamp(request.timestamp)}</span>
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 消費履歴 */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">📊 消費履歴</h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">まだ消費履歴がありません</p>
          ) : (
            <div className="space-y-2">
              {history.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800">{item.candyName}</span>
                    <span className="text-sm text-gray-600">×{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-primary">{formatPrice(item.priceAtTime)}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;
