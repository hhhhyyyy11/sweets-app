import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';

interface Candy {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

interface CandyFormData {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
}

const SweetsManagement: React.FC = () => {
  const [candies, setCandies] = useState<Candy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCandy, setEditingCandy] = useState<Candy | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState<CandyFormData>({
    name: '',
    description: '',
    imageUrl: '',
    price: 0,
    stock: 0,
    isActive: true,
  });

  useEffect(() => {
    loadCandies();
  }, []);

  const loadCandies = async () => {
    try {
      setLoading(true);
      const candiesRef = collection(db, 'candies');
      const snapshot = await getDocs(candiesRef);

      const candiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Candy));

      // 作成日時でソート
      candiesData.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      setCandies(candiesData);
    } catch (error) {
      console.error('Error loading candies:', error);
      setErrorMessage('お菓子の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAddCandy = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const candiesRef = collection(db, 'candies');

      await addDoc(candiesRef, {
        ...formData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setSuccessMessage('お菓子を追加しました');
      setShowAddForm(false);
      resetForm();
      await loadCandies();
    } catch (error) {
      console.error('Error adding candy:', error);
      setErrorMessage('お菓子の追加に失敗しました');
    }
  };

  const handleEditCandy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandy) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      const candyRef = doc(db, 'candies', editingCandy.id);

      await updateDoc(candyRef, {
        ...formData,
        updatedAt: Timestamp.now(),
      });

      setSuccessMessage('お菓子を更新しました');
      setEditingCandy(null);
      resetForm();
      await loadCandies();
    } catch (error) {
      console.error('Error updating candy:', error);
      setErrorMessage('お菓子の更新に失敗しました');
    }
  };

  const handleStockAdd = async (candy: Candy, amount: number) => {
    if (amount <= 0) return;

    try {
      const candyRef = doc(db, 'candies', candy.id);

      await updateDoc(candyRef, {
        stock: candy.stock + amount,
        updatedAt: Timestamp.now(),
      });

      setSuccessMessage(`${candy.name}の在庫を${amount}個追加しました`);
      await loadCandies();
    } catch (error) {
      console.error('Error adding stock:', error);
      setErrorMessage('在庫の追加に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      price: 0,
      stock: 0,
      isActive: true,
    });
  };

  const startEdit = (candy: Candy) => {
    setEditingCandy(candy);
    setFormData({
      name: candy.name,
      description: candy.description,
      imageUrl: candy.imageUrl,
      price: candy.price,
      stock: candy.stock,
      isActive: candy.isActive,
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingCandy(null);
    resetForm();
  };

  const startAdd = () => {
    setShowAddForm(true);
    setEditingCandy(null);
    resetForm();
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    resetForm();
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">お菓子管理</h1>
        <button
          className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
          onClick={startAdd}
        >
          <span>➕</span>
          <span>お菓子を追加</span>
        </button>
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

      {/* 追加フォーム */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">お菓子を追加</h2>
          <form onSubmit={handleAddCandy}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">お菓子名 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">画像URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">価格 (円) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">在庫数 *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">有効にする</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                追加
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                onClick={cancelAdd}
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 編集フォーム */}
      {editingCandy && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">お菓子を編集</h2>
          <form onSubmit={handleEditCandy}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">お菓子名 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">画像URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">価格 (円) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">在庫数 *</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">有効にする</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                更新
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                onClick={cancelEdit}
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* お菓子一覧 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {candies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            お菓子が登録されていません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">画像</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">お菓子名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">説明</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">価格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">在庫</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candies.map(candy => (
                  <tr key={candy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candy.imageUrl ? (
                        <img
                          src={candy.imageUrl}
                          alt={candy.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{candy.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{candy.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">¥{candy.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${candy.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                        {candy.stock}個
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        candy.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {candy.isActive ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-3 rounded transition-colors duration-200"
                          onClick={() => startEdit(candy)}
                        >
                          編集
                        </button>
                        <button
                          className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-3 rounded transition-colors duration-200"
                          onClick={() => {
                            const amount = prompt('追加する在庫数を入力してください', '10');
                            if (amount) {
                              handleStockAdd(candy, parseInt(amount));
                            }
                          }}
                        >
                          在庫追加
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

export default SweetsManagement;
