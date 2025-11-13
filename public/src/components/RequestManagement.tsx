import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc, Timestamp, query, orderBy } from 'firebase/firestore';

interface Request {
  id: string;
  userId: string;
  userName: string;
  candyName: string;
  description: string;
  status: 'requested' | 'purchased' | 'rejected';
  createdAt: any;
  updatedAt: any;
}

const RequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, 'requests');
      const q = query(requestsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Request));

      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading requests:', error);
      setErrorMessage('リクエストの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (request: Request, newStatus: 'requested' | 'purchased' | 'rejected') => {
    if (request.status === newStatus) {
      return;
    }

    const statusText = {
      requested: 'リクエスト中',
      purchased: '購入済み',
      rejected: '却下'
    };

    const confirmed = window.confirm(
      `${request.candyName}のステータスを「${statusText[newStatus]}」に変更しますか?`
    );

    if (!confirmed) return;

    try {
      setProcessingRequestId(request.id);
      setErrorMessage('');
      setSuccessMessage('');

      const requestRef = doc(db, 'requests', request.id);

      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      setSuccessMessage(`ステータスを「${statusText[newStatus]}」に変更しました`);
      await loadRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
      setErrorMessage('ステータスの更新に失敗しました');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const getFilteredRequests = () => {
    if (filterStatus === 'all') {
      return requests;
    }
    return requests.filter(request => request.status === filterStatus);
  };

  const getStatusCounts = () => {
    return {
      requested: requests.filter(r => r.status === 'requested').length,
      purchased: requests.filter(r => r.status === 'purchased').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requested':
        return 'リクエスト中';
      case 'purchased':
        return '購入済み';
      case 'rejected':
        return '却下';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  const filteredRequests = getFilteredRequests();
  const statusCounts = getStatusCounts();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">リクエスト管理</h1>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">📋</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">総リクエスト数</div>
            <div className="text-2xl font-bold text-gray-800">{requests.length}件</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">⏳</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">リクエスト中</div>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.requested}件</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">✅</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">購入済み</div>
            <div className="text-2xl font-bold text-green-600">{statusCounts.purchased}件</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="text-4xl">❌</div>
          <div>
            <div className="text-sm text-gray-500 font-medium">却下</div>
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}件</div>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">ステータス:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="all">すべて</option>
          <option value="requested">リクエスト中</option>
          <option value="purchased">購入済み</option>
          <option value="rejected">却下</option>
        </select>
      </div>

      {/* リクエスト一覧 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filterStatus === 'all'
              ? 'リクエストがありません'
              : `${getStatusText(filterStatus)}のリクエストがありません`
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">リクエスト日時</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">お菓子名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">詳細</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {request.createdAt ?
                          new Date(request.createdAt.seconds * 1000).toLocaleString('ja-JP')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.candyName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{request.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'purchased' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getStatusText(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          onClick={() => handleStatusChange(request, 'purchased')}
                          disabled={request.status === 'purchased' || processingRequestId === request.id}
                        >
                          購入済み
                        </button>
                        <button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          onClick={() => handleStatusChange(request, 'requested')}
                          disabled={request.status === 'requested' || processingRequestId === request.id}
                        >
                          リクエスト中
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          onClick={() => handleStatusChange(request, 'rejected')}
                          disabled={request.status === 'rejected' || processingRequestId === request.id}
                        >
                          却下
                        </button>
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

export default RequestManagement;
