// ============================
// Users
// ============================
export interface User {
  id: string;  // Document ID (= LINE User ID)
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  email: string;
  role: 'admin' | 'user';
  currentBalance: number;  // 未払い額（負の値、例: -500）
  createdAt: any;
  updatedAt: any;
}

// ============================
// Candies (お菓子マスタ)
// ============================
export interface Candy {
  id: string;  // Document ID
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// ============================
// Eating History (消費履歴)
// ============================
export interface EatingHistory {
  id: string;  // Document ID
  userId: string;  // users collection の Document ID
  candyId: string;  // candies collection の Document ID
  candyName: string;  // お菓子名（スナップショット）
  quantity: number;  // 消費数量
  priceAtTime: number;  // 消費時の価格
  timestamp: any;  // Firestore Timestamp
}

// ============================
// Requests (リクエスト)
// ============================
export interface Request {
  id: string;  // Document ID
  userId: string;  // users collection の Document ID
  candyName: string;  // リクエストするお菓子名
  description?: string;  // 説明・理由
  status: 'requested' | 'purchased' | 'rejected';
  timestamp: any;  // Firestore Timestamp
  processedAt?: any;  // 処理日時（optional）
  processedBy?: string;  // 処理者のuserId（optional）
}

// ============================
// 後方互換性のための既存の型定義
// ============================
export interface Sweet {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  stock: number;
  createdAt: any;
  updatedAt: any;
}

export interface ConsumptionHistory {
  id: string;
  sweetId: string;
  sweetName: string;
  userId: string;
  quantity: number;
  timestamp: any;
}

export interface StockHistory {
  id: string;
  sweetId: string;
  sweetName: string;
  quantity: number;
  type: 'add' | 'remove';
  timestamp: any;
}
