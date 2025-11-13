"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyReminder = exports.lineBotWebhook = exports.createCustomToken = exports.eatCandy = exports.api = exports.lineWebhook = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const v2_1 = require("firebase-functions/v2");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const bot_sdk_1 = require("@line/bot-sdk");
const url_1 = require("url");
// グローバル設定
(0, v2_1.setGlobalOptions)({ region: "asia-northeast2" });
// Firebase Admin初期化
admin.initializeApp();
const db = admin.firestore();
// LINE Bot設定 (デプロイ時はダミー値、実行時に環境変数から取得)
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "DUMMY_TOKEN_FOR_DEPLOYMENT",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "DUMMY_SECRET_FOR_DEPLOYMENT",
};
const lineClient = new bot_sdk_1.Client(lineConfig);
// Express設定
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// ============================
// LINE Bot Webhook
// ============================
exports.lineWebhook = (0, https_1.onRequest)(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const events = req.body.events || [];
    try {
        await Promise.all(events.map(handleEvent));
        res.status(200).send("OK");
    }
    catch (error) {
        console.error("Error handling webhook:", error);
        res.status(500).send("Internal Server Error");
    }
});
async function handleEvent(event) {
    if (event.type !== "message" || event.message.type !== "text") {
        return;
    }
    const messageEvent = event;
    const textMessage = messageEvent.message;
    const userId = messageEvent.source.userId;
    if (!userId)
        return;
    const text = textMessage.text.trim();
    // ユーザー情報を取得または作成
    await ensureUser(userId);
    // コマンド処理
    if (text === "一覧" || text === "リスト") {
        await handleListCommand(userId);
    }
    else if (text.startsWith("消費 ")) {
        await handleConsumeCommand(userId, text);
    }
    else if (text === "ヘルプ" || text === "使い方") {
        await handleHelpCommand(userId);
    }
    else {
        await lineClient.replyMessage(messageEvent.replyToken, {
            type: "text",
            text: "コマンドが認識できませんでした。「ヘルプ」と送信してください。",
        });
    }
}
async function ensureUser(lineUserId) {
    const userRef = db.collection("users").doc(lineUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        // LINE APIからプロフィール取得
        try {
            const profile = await lineClient.getProfile(lineUserId);
            await userRef.set({
                lineUserId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl || "",
                role: "user",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        catch (error) {
            console.error("Error creating user:", error);
            // プロフィール取得失敗時もユーザー作成
            await userRef.set({
                lineUserId,
                displayName: "Unknown User",
                pictureUrl: "",
                role: "user",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
}
async function handleListCommand(userId) {
    const sweetsSnapshot = await db.collection("sweets")
        .where("stock", ">", 0)
        .orderBy("stock", "desc")
        .get();
    if (sweetsSnapshot.empty) {
        await lineClient.pushMessage(userId, {
            type: "text",
            text: "現在、在庫のあるお菓子はありません。",
        });
        return;
    }
    let message = "📦 在庫のあるお菓子:\n\n";
    sweetsSnapshot.forEach((doc) => {
        const sweet = doc.data();
        message += `・${sweet.name} (残り: ${sweet.stock}個)\n`;
    });
    await lineClient.pushMessage(userId, {
        type: "text",
        text: message,
    });
}
async function handleConsumeCommand(userId, text) {
    const parts = text.split(" ");
    if (parts.length < 2) {
        await lineClient.pushMessage(userId, {
            type: "text",
            text: "使い方: 消費 [お菓子名] [個数(省略可、デフォルト1)]",
        });
        return;
    }
    const sweetName = parts[1];
    const quantity = parts.length > 2 ? parseInt(parts[2], 10) : 1;
    if (isNaN(quantity) || quantity <= 0) {
        await lineClient.pushMessage(userId, {
            type: "text",
            text: "個数は正の数字で指定してください。",
        });
        return;
    }
    // お菓子を検索
    const sweetsSnapshot = await db.collection("sweets")
        .where("name", "==", sweetName)
        .limit(1)
        .get();
    if (sweetsSnapshot.empty) {
        await lineClient.pushMessage(userId, {
            type: "text",
            text: `「${sweetName}」が見つかりませんでした。`,
        });
        return;
    }
    const sweetDoc = sweetsSnapshot.docs[0];
    const sweet = sweetDoc.data();
    if (sweet.stock < quantity) {
        await lineClient.pushMessage(userId, {
            type: "text",
            text: `在庫が足りません。現在の在庫: ${sweet.stock}個`,
        });
        return;
    }
    // トランザクションで在庫減少 + 履歴追加
    try {
        await db.runTransaction(async (transaction) => {
            const sweetRef = db.collection("sweets").doc(sweetDoc.id);
            transaction.update(sweetRef, {
                stock: admin.firestore.FieldValue.increment(-quantity),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            const historyRef = db.collection("consumptionHistory").doc();
            transaction.set(historyRef, {
                sweetId: sweetDoc.id,
                sweetName: sweet.name,
                userId,
                quantity,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await lineClient.pushMessage(userId, {
            type: "text",
            text: `✅ ${sweetName} を ${quantity}個 消費しました。\n残り: ${sweet.stock - quantity}個`,
        });
        // 在庫が少なくなったら通知
        if (sweet.stock - quantity <= 5 && sweet.stock - quantity > 0) {
            await notifyLowStock(sweetDoc.id, sweet.name, sweet.stock - quantity);
        }
    }
    catch (error) {
        console.error("Error consuming sweet:", error);
        await lineClient.pushMessage(userId, {
            type: "text",
            text: "エラーが発生しました。もう一度お試しください。",
        });
    }
}
async function handleHelpCommand(userId) {
    const helpMessage = `
🍭 お菓子管理Bot 使い方

【コマンド一覧】
・一覧 / リスト
  → 在庫のあるお菓子を表示

・消費 [お菓子名] [個数]
  → お菓子を消費する
  例: 消費 ポテトチップス 2

・ヘルプ / 使い方
  → このメッセージを表示

Web管理画面で在庫の追加や管理ができます!
  `;
    await lineClient.pushMessage(userId, {
        type: "text",
        text: helpMessage.trim(),
    });
}
async function notifyLowStock(sweetId, sweetName, currentStock) {
    // 管理者に通知
    const adminsSnapshot = await db.collection("users")
        .where("role", "==", "admin")
        .get();
    const notifications = adminsSnapshot.docs.map((doc) => {
        const admin = doc.data();
        return lineClient.pushMessage(admin.lineUserId, {
            type: "text",
            text: `⚠️ 在庫が少なくなっています!\n\n${sweetName}\n残り: ${currentStock}個`,
        });
    });
    await Promise.all(notifications);
}
// ============================
// REST API
// ============================
// お菓子一覧取得
app.get("/sweets", async (req, res) => {
    try {
        const sweetsSnapshot = await db.collection("sweets")
            .orderBy("createdAt", "desc")
            .get();
        const sweets = sweetsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.json({ sweets });
    }
    catch (error) {
        console.error("Error fetching sweets:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// お菓子追加
app.post("/sweets", async (req, res) => {
    try {
        const { name, description, imageUrl, stock } = req.body;
        if (!name || stock === undefined) {
            res.status(400).json({ error: "Name and stock are required" });
            return;
        }
        const sweetRef = await db.collection("sweets").add({
            name,
            description: description || "",
            imageUrl: imageUrl || "",
            stock: stock || 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.json({ id: sweetRef.id, message: "Sweet created successfully" });
    }
    catch (error) {
        console.error("Error creating sweet:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// お菓子更新
app.put("/sweets/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, imageUrl, stock } = req.body;
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl;
        if (stock !== undefined)
            updateData.stock = stock;
        await db.collection("sweets").doc(id).update(updateData);
        res.json({ message: "Sweet updated successfully" });
    }
    catch (error) {
        console.error("Error updating sweet:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// お菓子削除
app.delete("/sweets/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection("sweets").doc(id).delete();
        res.json({ message: "Sweet deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting sweet:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// 消費履歴取得
app.get("/consumption-history", async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const historySnapshot = await db.collection("consumptionHistory")
            .orderBy("timestamp", "desc")
            .limit(limit)
            .get();
        const history = historySnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.json({ history });
    }
    catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// ユーザー一覧取得
app.get("/users", async (req, res) => {
    try {
        const usersSnapshot = await db.collection("users").get();
        const users = usersSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        res.json({ users });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.api = (0, https_1.onRequest)(app);
// ============================
// お菓子消費API (eatCandy)
// ============================
/**
 * お菓子を消費する
 * リージョン: asia-northeast2（東京）
 */
exports.eatCandy = (0, https_1.onRequest)(async (req, res) => {
    // CORSヘッダーを設定
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    // POSTリクエストのみを受け付ける
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed. Use POST." });
        return;
    }
    try {
        // Authorization ヘッダーから Firebase ID トークンを取得
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ error: "Unauthorized. Missing token." });
            return;
        }
        const idToken = authHeader.split("Bearer ")[1];
        // Firebase ID トークンを検証
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;
        console.log(`User ${userId} is eating candy`);
        // リクエストボディから candyId を取得
        const { candyId } = req.body;
        if (!candyId) {
            res.status(400).json({ error: "candyId is required" });
            return;
        }
        // Firestoreトランザクションで処理
        const result = await db.runTransaction(async (transaction) => {
            // 1. お菓子情報を取得
            const candyRef = db.collection("candies").doc(candyId);
            const candyDoc = await transaction.get(candyRef);
            if (!candyDoc.exists) {
                throw new Error("Candy not found");
            }
            const candyData = candyDoc.data();
            // 在庫確認
            if (!candyData || candyData.stock <= 0) {
                throw new Error("Out of stock");
            }
            // アクティブ確認
            if (!candyData.isActive) {
                throw new Error("This candy is not active");
            }
            const price = candyData.price || 0;
            const candyName = candyData.name || "Unknown";
            // 2. ユーザー情報を取得
            const userRef = db.collection("users").doc(userId);
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                // ユーザーが存在しない場合は作成
                transaction.set(userRef, {
                    lineUserId: userId,
                    displayName: "User",
                    pictureUrl: "",
                    email: "",
                    role: "user",
                    currentBalance: -price,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            else {
                // 3. ユーザーの未払い額を更新
                const userData = userDoc.data();
                const currentBalance = (userData === null || userData === void 0 ? void 0 : userData.currentBalance) || 0;
                transaction.update(userRef, {
                    currentBalance: currentBalance - price,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            // 4. 在庫を減らす
            transaction.update(candyRef, {
                stock: admin.firestore.FieldValue.increment(-1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 5. 消費履歴を追加
            const historyRef = db.collection("eatingHistory").doc();
            transaction.set(historyRef, {
                userId,
                candyId,
                candyName,
                quantity: 1,
                priceAtTime: price,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                candyName,
                price,
                newStock: candyData.stock - 1,
                historyId: historyRef.id,
            };
        });
        console.log(`Candy consumed successfully: ${result.candyName}`);
        // 成功レスポンス
        res.status(200).json({
            success: true,
            message: `${result.candyName} を消費しました`,
            data: {
                candyName: result.candyName,
                price: result.price,
                newStock: result.newStock,
                historyId: result.historyId,
            },
        });
    }
    catch (error) {
        console.error("Error in eatCandy:", error);
        // エラーレスポンス
        let statusCode = 500;
        let errorMessage = "Internal Server Error";
        if (error.message === "Candy not found") {
            statusCode = 404;
            errorMessage = "お菓子が見つかりません";
        }
        else if (error.message === "Out of stock") {
            statusCode = 400;
            errorMessage = "在庫がありません";
        }
        else if (error.message === "This candy is not active") {
            statusCode = 400;
            errorMessage = "このお菓子は現在利用できません";
        }
        else if (error.code === "auth/id-token-expired") {
            statusCode = 401;
            errorMessage = "トークンの期限が切れています";
        }
        else if (error.code === "auth/argument-error") {
            statusCode = 401;
            errorMessage = "認証トークンが無効です";
        }
        res.status(statusCode).json({
            success: false,
            error: errorMessage,
            details: error.message,
        });
    }
});
/**
 * LINE IDトークンを検証し、Firebaseカスタムトークンを発行する
 */
exports.createCustomToken = (0, https_1.onRequest)(async (req, res) => {
    // CORSヘッダーを設定
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    // POSTリクエストのみを受け付ける
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed. Use POST." });
        return;
    }
    try {
        // 1. リクエストボディから IDトークンを取得
        const idToken = req.body.idToken;
        if (!idToken) {
            v2_1.logger.warn('ID token is missing');
            res.status(400).json({ error: 'ID token is required' });
            return;
        }
        // 2. LINEサーバーでIDトークンを検証
        const lineClientId = process.env.LINE_LOGIN_CHANNEL_ID || "";
        if (!lineClientId) {
            v2_1.logger.error('LINE_LOGIN_CHANNEL_ID is not set');
            res.status(500).json({ error: 'Server configuration error' });
            return;
        }
        const params = new url_1.URLSearchParams();
        params.append('id_token', idToken);
        params.append('client_id', lineClientId);
        const lineVerifyResponse = await axios_1.default.post('https://api.line.me/oauth2/v2.1/verify', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const lineProfile = lineVerifyResponse.data;
        const lineUserId = lineProfile.sub; // LINEのUserID
        v2_1.logger.info(`LINE token verified for user: ${lineUserId}`);
        // 3. Firebaseカスタムトークンを生成
        const firebaseToken = await admin.auth().createCustomToken(lineUserId);
        // 4. Firestoreにユーザー情報を保存/更新
        const userRef = db.collection('users').doc(lineUserId);
        const userDoc = await userRef.get();
        const userData = {
            lineUserId: lineUserId,
            displayName: lineProfile.name || "Unknown User",
            pictureUrl: lineProfile.picture || "",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (!userDoc.exists) {
            // 新規ユーザー
            await userRef.set(Object.assign(Object.assign({}, userData), { role: 'user', currentBalance: 0, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        }
        else {
            // 既存ユーザー
            await userRef.update(userData);
        }
        const updatedUserDoc = await userRef.get();
        const fullUserData = updatedUserDoc.data();
        v2_1.logger.info(`Successfully created token for user: ${lineUserId}`);
        // 5. 成功レスポンスを返す
        res.status(200).json({
            firebaseToken: firebaseToken,
            user: fullUserData,
        });
    }
    catch (error) {
        v2_1.logger.error('Error creating custom token:', error);
        if (error.response) {
            v2_1.logger.error('Error response from LINE:', error.response.data);
            res.status(401).json({ error: 'Failed to verify LINE token', details: error.response.data });
        }
        else {
            res.status(500).json({ error: 'Internal server error', details: error.message });
        }
    }
});
// ============================
// LINE Bot Webhook (Messaging API)
// ============================
exports.lineBotWebhook = (0, https_1.onRequest)(async (req, res) => {
    // POSTメソッドのみ許可
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }
    // LINE署名検証
    const signature = req.headers["x-line-signature"];
    if (!signature) {
        console.error("Missing LINE signature");
        res.status(401).json({ error: "Missing signature" });
        return;
    }
    // 署名検証のための設定
    const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
    if (!channelSecret) {
        console.error("LINE Channel Secret is not configured");
        res.status(500).json({ error: "Server configuration error" });
        return;
    }
    // リクエストボディを文字列として取得
    const bodyString = JSON.stringify(req.body);
    // @line/bot-sdkのvalidateSignature関数を使用して署名検証
    try {
        const isValid = (0, bot_sdk_1.validateSignature)(bodyString, channelSecret, signature);
        if (!isValid) {
            console.error("Invalid LINE signature");
            res.status(401).json({ error: "Invalid signature" });
            return;
        }
    }
    catch (error) {
        console.error("Error validating signature:", error);
        res.status(401).json({ error: "Signature validation failed" });
        return;
    }
    console.log("LINE signature verified successfully");
    // Webhookイベント処理
    const events = req.body.events || [];
    try {
        await Promise.all(events.map(async (event) => {
            await handleBotEvent(event);
        }));
        res.status(200).json({ message: "OK" });
    }
    catch (error) {
        console.error("Error handling LINE webhook:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
/**
 * LINE Botイベントハンドラー
 */
async function handleBotEvent(event) {
    // テキストメッセージのみ処理
    if (event.type !== "message" || event.message.type !== "text") {
        console.log(`Ignoring non-text message event: ${event.type}`);
        return;
    }
    const messageEvent = event;
    const textMessage = messageEvent.message;
    const userId = messageEvent.source.userId;
    if (!userId) {
        console.log("No userId found in event");
        return;
    }
    const messageText = textMessage.text.trim();
    console.log(`Received message from ${userId}: ${messageText}`);
    try {
        // ユーザー情報を取得
        let userName = "Unknown User";
        try {
            const profile = await lineClient.getProfile(userId);
            userName = profile.displayName;
        }
        catch (error) {
            console.error("Error getting LINE profile:", error);
        }
        // requestsコレクションに保存
        const requestData = {
            userId: userId,
            userName: userName,
            candyName: messageText,
            description: `LINE Botから送信: ${messageText}`,
            status: "requested",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const requestRef = await db.collection("requests").add(requestData);
        console.log(`Request created with ID: ${requestRef.id}`);
        // ユーザーに返信
        await lineClient.replyMessage(messageEvent.replyToken, {
            type: "text",
            text: `リクエストを受け付けました✅\n\nお菓子名: ${messageText}\n\n管理者が確認後、対応いたします。`,
        });
        console.log(`Reply sent to user ${userId}`);
    }
    catch (error) {
        console.error("Error processing bot event:", error);
        // エラー時もユーザーに返信
        try {
            await lineClient.replyMessage(messageEvent.replyToken, {
                type: "text",
                text: "申し訳ございません。エラーが発生しました。\nしばらく時間をおいて再度お試しください。",
            });
        }
        catch (replyError) {
            console.error("Error sending error reply:", replyError);
        }
    }
}
// ============================
// 月次集計リマインダー
// ============================
/**
 * 月次集計リマインダー
 * 毎月1日午前9時（日本時間）に実行
 * 未払いのあるユーザーにLINEでプッシュ通知を送信
 */
exports.monthlyReminder = (0, scheduler_1.onSchedule)({
    schedule: "0 0 1 * *", // 毎月1日の午前0時（UTC）に実行
    timeZone: "Asia/Tokyo", // 日本時間で実行
}, async (event) => {
    console.log("Monthly reminder started");
    try {
        // usersコレクションから全ユーザーを取得
        const usersSnapshot = await db.collection("users").get();
        if (usersSnapshot.empty) {
            console.log("No users found");
            return;
        }
        console.log(`Total users: ${usersSnapshot.size}`);
        // 未払いのあるユーザーを抽出
        const unpaidUsers = [];
        usersSnapshot.forEach((doc) => {
            const userData = doc.data();
            const currentBalance = userData.currentBalance || 0;
            // currentBalanceが0より大きい（未払いがある）ユーザーを抽出
            if (currentBalance > 0 && userData.lineUserId) {
                unpaidUsers.push({
                    userId: doc.id,
                    lineUserId: userData.lineUserId,
                    displayName: userData.displayName || "ユーザー",
                    currentBalance: currentBalance,
                });
            }
        });
        console.log(`Unpaid users found: ${unpaidUsers.length}`);
        if (unpaidUsers.length === 0) {
            console.log("No unpaid users found");
            return;
        }
        // 各ユーザーにLINEでプッシュ通知を送信
        const sendPromises = unpaidUsers.map(async (user) => {
            try {
                const message = `📊 月次集計のお知らせ\n\n${user.displayName}さん\n今月の未払い額は ${user.currentBalance}円 です。\n\nお支払いをお願いいたします。`;
                await lineClient.pushMessage(user.lineUserId, {
                    type: "text",
                    text: message,
                });
                console.log(`Reminder sent to ${user.displayName} (¥${user.currentBalance})`);
                return {
                    success: true,
                    userId: user.userId,
                    amount: user.currentBalance,
                };
            }
            catch (error) {
                console.error(`Error sending reminder to ${user.displayName}:`, error);
                return {
                    success: false,
                    userId: user.userId,
                    amount: user.currentBalance,
                    error: error,
                };
            }
        });
        // すべての送信を並列実行
        const results = await Promise.all(sendPromises);
        // 結果の集計
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;
        const totalAmount = results.reduce((sum, r) => sum + r.amount, 0);
        console.log("Monthly reminder completed");
        console.log(`Success: ${successCount}, Failure: ${failureCount}`);
        console.log(`Total unpaid amount: ¥${totalAmount}`);
        // 管理者に結果を通知（オプション）
        await notifyAdminsAboutReminder(successCount, failureCount, totalAmount);
    }
    catch (error) {
        console.error("Error in monthly reminder:", error);
        throw error;
    }
});
/**
 * 管理者にリマインダー送信結果を通知
 */
async function notifyAdminsAboutReminder(successCount, failureCount, totalAmount) {
    try {
        // 管理者ユーザーを取得
        const adminsSnapshot = await db.collection("users")
            .where("role", "==", "admin")
            .get();
        if (adminsSnapshot.empty) {
            console.log("No admin users found for notification");
            return;
        }
        const message = `📊 月次リマインダー送信完了\n\n` +
            `✅ 送信成功: ${successCount}件\n` +
            `❌ 送信失敗: ${failureCount}件\n` +
            `💰 未払い総額: ¥${totalAmount}\n\n` +
            `詳細は管理画面でご確認ください。`;
        // 各管理者にプッシュ通知
        const adminNotifications = adminsSnapshot.docs.map(async (doc) => {
            const adminData = doc.data();
            if (adminData.lineUserId) {
                try {
                    await lineClient.pushMessage(adminData.lineUserId, {
                        type: "text",
                        text: message,
                    });
                    console.log(`Admin notification sent to ${adminData.displayName}`);
                }
                catch (error) {
                    console.error(`Error sending admin notification to ${adminData.displayName}:`, error);
                }
            }
        });
        await Promise.all(adminNotifications);
    }
    catch (error) {
        console.error("Error notifying admins:", error);
    }
}
//# sourceMappingURL=index.js.map
