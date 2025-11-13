import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface History {
  id: string;
  userId: string;
  userName: string;
  candyId: string;
  candyName: string;
  quantity: number;
  priceAtTime: number;
  timestamp: any;
}

const ConsumptionHistory: React.FC = () => {
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [filterCandyId, setFilterCandyId] = useState<string>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const historyRef = collection(db, 'eatingHistory');
      const q = query(historyRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as History));

      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
      setErrorMessage('履歴の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    let filtered = history;

    if (filterUserId !== 'all') {
      filtered = filtered.filter(h => h.userId === filterUserId);
    }

    if (filterCandyId !== 'all') {
      filtered = filtered.filter(h => h.candyId === filterCandyId);
    }

    return filtered;
  };

  const getTotalAmount = (historyList: History[]) => {
    return historyList.reduce((sum, item) => sum + item.priceAtTime * item.quantity, 0);
  };

  const getTotalQuantity = (historyList: History[]) => {
    return historyList.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getUniqueUsers = () => {
    const users = new Map<string, string>();
    history.forEach(h => {
      if (!users.has(h.userId)) {
        users.set(h.userId, h.userName);
      }
    });
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  };

  const getUniqueCandies = () => {
    const candies = new Map<string, string>();
    history.forEach(h => {
      if (!candies.has(h.candyId)) {
        candies.set(h.candyId, h.candyName);
      }
    });
    return Array.from(candies.entries()).map(([id, name]) => ({ id, name }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  const filteredHistory = getFilteredHistory();
  const totalAmount = getTotalAmount(filteredHistory);
  const totalQuantity = getTotalQuantity(filteredHistory);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">消費履歴</h1>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4 shadow">
          <p className="text-red-800 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">📊</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">総消費件数</div>
            <div className="text-2xl font-bold text-gray-800">{filteredHistory.length}件</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">🍬</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">総消費個数</div>
            <div className="text-2xl font-bold text-gray-800">{totalQuantity}個</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">💰</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">総売上金額</div>
            <div className="text-2xl font-bold text-primary">¥{totalAmount}</div>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">ユーザー:</label>
            <select
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
            <option value="all">すべて</option>
            {getUniqueUsers().map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">お菓子:</label>
          <select
            value={filterCandyId}
            onChange={(e) => setFilterCandyId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">すべて</option>
            {getUniqueCandies().map(candy => (
              <option key={candy.id} value={candy.id}>{candy.name}</option>
            ))}
          </select>
        </div>

        {(filterUserId !== 'all' || filterCandyId !== 'all') && (
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            onClick={() => {
              setFilterUserId('all');
              setFilterCandyId('all');
            }}
          >
            フィルターをクリア
          </button>
        )}
        </div>
      </div>

      {/* 履歴一覧 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            消費履歴がありません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">お菓子名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">個数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">単価</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合計金額</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {item.timestamp ?
                          new Date(item.timestamp.seconds * 1000).toLocaleString('ja-JP')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.userName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.candyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.quantity}個</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">¥{item.priceAtTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-primary">
                        ¥{item.priceAtTime * item.quantity}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumptionHistory;
