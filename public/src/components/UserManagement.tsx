import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

interface User {
  id: string;
  displayName: string;
  lineUserId: string;
  pictureUrl: string;
  currentBalance: number;
  role: string;
  createdAt: any;
  updatedAt: any;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));

      // 残高順でソート(多い順)
      usersData.sort((a, b) => b.currentBalance - a.currentBalance);

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setErrorMessage('ユーザーの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSettleBalance = async (user: User) => {
    if (user.currentBalance === 0) {
      setErrorMessage('既に残高は0円です');
      return;
    }

    const confirmed = window.confirm(
      `${user.displayName}さんの残高 ¥${user.currentBalance} を0円にリセットしますか?\n\n※この操作は取り消せません。`
    );

    if (!confirmed) return;

    try {
      setProcessingUserId(user.id);
      setErrorMessage('');
      setSuccessMessage('');

      const userRef = doc(db, 'users', user.id);

      await updateDoc(userRef, {
        currentBalance: 0,
        updatedAt: Timestamp.now(),
      });

      setSuccessMessage(`${user.displayName}さんの残高をリセットしました`);
      await loadUsers();
    } catch (error) {
      console.error('Error settling balance:', error);
      setErrorMessage('残高のリセットに失敗しました');
    } finally {
      setProcessingUserId(null);
    }
  };

  const getTotalBalance = () => {
    return users.reduce((sum, user) => sum + user.currentBalance, 0);
  };

  const getUnpaidUsersCount = () => {
    return users.filter(user => user.currentBalance > 0).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">ユーザー管理 / 集金管理</h1>
      </div>

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4 shadow">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4 shadow">
          <p className="text-red-800 font-medium">{errorMessage}</p>
        </div>
      )}

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">👥</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">総ユーザー数</div>
            <div className="text-2xl font-bold text-gray-800">{users.length}人</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">💰</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">未払い総額</div>
            <div className="text-2xl font-bold text-gray-800">¥{getTotalBalance()}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">📋</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">未払いユーザー</div>
            <div className="text-2xl font-bold text-gray-800">{getUnpaidUsersCount()}人</div>
          </div>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            ユーザーが登録されていません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">写真</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LINE ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">権限</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">残高</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.pictureUrl ? (
                        <img
                          src={user.pictureUrl}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                          👤
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.lineUserId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? '管理者' : 'ユーザー'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${
                        user.currentBalance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ¥{user.currentBalance}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {user.createdAt ?
                          new Date(user.createdAt.seconds * 1000).toLocaleDateString('ja-JP')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        onClick={() => handleSettleBalance(user)}
                        disabled={user.currentBalance === 0 || processingUserId === user.id}
                      >
                        {processingUserId === user.id ? '処理中...' : '集金済み'}
                      </button>
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

export default UserManagement;
