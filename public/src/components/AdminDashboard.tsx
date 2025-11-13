import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import SweetsManagement from './SweetsManagement';
import ConsumptionHistory from './ConsumptionHistory';
import UserManagement from './UserManagement';
import RequestManagement from './RequestManagement';

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setIsAdmin(userData.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // 管理者権限がない場合
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ アクセス拒否</h2>
          <p className="text-gray-700 text-lg">管理者権限がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <nav className="w-64 bg-gradient-to-b from-primary to-secondary text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-white border-opacity-20">
          <h2 className="text-2xl font-bold">🍭 お菓子管理</h2>
        </div>

        <ul className="flex-1 py-4">
          <li>
            <Link
              to="/admin/sweets"
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive('/admin/sweets')
                  ? 'bg-white bg-opacity-20 border-l-4 border-white'
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="text-2xl">📦</span>
              <span className="font-medium">お菓子管理</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/history"
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive('/admin/history')
                  ? 'bg-white bg-opacity-20 border-l-4 border-white'
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="text-2xl">📊</span>
              <span className="font-medium">消費履歴</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/users"
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive('/admin/users')
                  ? 'bg-white bg-opacity-20 border-l-4 border-white'
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="text-2xl">👥</span>
              <span className="font-medium">ユーザー管理</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/requests"
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive('/admin/requests')
                  ? 'bg-white bg-opacity-20 border-l-4 border-white'
                  : 'hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <span className="text-2xl">📝</span>
              <span className="font-medium">リクエスト管理</span>
            </Link>
          </li>
        </ul>

        <div className="p-4 border-t border-white border-opacity-20">
          <button
            className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-auto p-6">
        <Routes>
          <Route path="/" element={<Navigate to="/admin/sweets" />} />
          <Route path="/sweets" element={<SweetsManagement />} />
          <Route path="/history" element={<ConsumptionHistory />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/requests" element={<RequestManagement />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
