"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMongoDatabase = exports.dbService = void 0;
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("../config/firebase");
const getProductImagePreset = (category) => {
    const mapping = {
        'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
        'Milk Powder': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80',
        'Biscuits': 'https://images.unsplash.com/photo-1558961309-dbdf71799f18?w=300&auto=format&fit=crop&q=80',
        'Snacks': 'https://images.unsplash.com/photo-1599490659283-4462babb6c31?w=300&auto=format&fit=crop&q=80',
        'Personal Care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
        'Soap': 'https://images.unsplash.com/photo-1607006342411-9a3363d63b36?w=300&auto=format&fit=crop&q=80',
        'Toothpaste': 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=300&auto=format&fit=crop&q=80',
        'Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80',
        'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=80',
        'Margarine': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80',
        'Sauce': 'https://images.unsplash.com/photo-1607305387299-a3d9611cd46f?w=300&auto=format&fit=crop&q=80',
        'Instant Food': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&auto=format&fit=crop&q=80',
        'Beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
        'Dairy': 'https://images.unsplash.com/photo-1528750955906-79c2409f3e7e?w=300&auto=format&fit=crop&q=80',
        'Chocolate': 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&auto=format&fit=crop&q=80',
        'Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&auto=format&fit=crop&q=80',
        'Detergent': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
    };
    return mapping[category] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
};
exports.dbService = {
    // --- USERS ---
    getUser: async (firebaseId) => {
        const userRef = (0, firestore_1.doc)(firebase_1.db, 'users', firebaseId);
        const userSnap = await (0, firestore_1.getDoc)(userRef);
        return userSnap.exists() ? { _id: userSnap.id, id: userSnap.id, ...userSnap.data() } : null;
    },
    getUsers: async () => {
        const usersSnap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'users'));
        return usersSnap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
    },
    createUser: async (userData) => {
        const firebaseId = userData.firebaseId;
        if (!firebaseId)
            throw new Error('Missing firebaseId');
        const userRef = (0, firestore_1.doc)(firebase_1.db, 'users', firebaseId);
        const docData = {
            ...userData,
            budgetLimit: userData.budgetLimit || 0,
            budgetHistory: userData.budgetHistory || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await (0, firestore_1.setDoc)(userRef, docData);
        return { _id: firebaseId, id: firebaseId, ...docData };
    },
    updateUserBudget: async (firebaseId, budgetLimit) => {
        const userRef = (0, firestore_1.doc)(firebase_1.db, 'users', firebaseId);
        const userSnap = await (0, firestore_1.getDoc)(userRef);
        if (!userSnap.exists())
            return null;
        const currentData = userSnap.data();
        const budgetHistory = currentData.budgetHistory || [];
        budgetHistory.push({ date: new Date().toISOString(), limit: budgetLimit });
        await (0, firestore_1.updateDoc)(userRef, {
            budgetLimit,
            budgetHistory,
            updatedAt: new Date().toISOString()
        });
        return { _id: firebaseId, id: firebaseId, ...currentData, budgetLimit, budgetHistory };
    },
    // --- PRODUCTS ---
    getProducts: async () => {
        const snap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'products'));
        return snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
    },
    getProductByRfid: async (uid) => {
        const productRef = (0, firestore_1.doc)(firebase_1.db, 'products', uid);
        const productSnap = await (0, firestore_1.getDoc)(productRef);
        return productSnap.exists() ? { _id: productSnap.id, id: productSnap.id, ...productSnap.data() } : null;
    },
    getProductById: async (id) => {
        const productRef = (0, firestore_1.doc)(firebase_1.db, 'products', id);
        const productSnap = await (0, firestore_1.getDoc)(productRef);
        return productSnap.exists() ? { _id: productSnap.id, id: productSnap.id, ...productSnap.data() } : null;
    },
    createProduct: async (productData) => {
        const uid = productData.uid;
        if (!uid)
            throw new Error('Missing uid');
        const productRef = (0, firestore_1.doc)(firebase_1.db, 'products', uid);
        const category = productData.category || 'General';
        const imageUrlPreset = getProductImagePreset(category);
        const docData = {
            uid,
            name: productData.name,
            price: Number(productData.price),
            weight: Number(productData.weight),
            stock: productData.stock !== undefined ? Number(productData.stock) : 100,
            category,
            imageUrl: productData.imageUrl || imageUrlPreset,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await (0, firestore_1.setDoc)(productRef, docData);
        return { _id: uid, id: uid, ...docData };
    },
    updateProduct: async (id, productData) => {
        const productRef = (0, firestore_1.doc)(firebase_1.db, 'products', id);
        const productSnap = await (0, firestore_1.getDoc)(productRef);
        if (!productSnap.exists())
            return null;
        const docData = {
            ...productData,
            price: productData.price !== undefined ? Number(productData.price) : undefined,
            weight: productData.weight !== undefined ? Number(productData.weight) : undefined,
            stock: productData.stock !== undefined ? Number(productData.stock) : undefined,
            updatedAt: new Date().toISOString()
        };
        Object.keys(docData).forEach(key => docData[key] === undefined && delete docData[key]);
        await (0, firestore_1.updateDoc)(productRef, docData);
        const updatedSnap = await (0, firestore_1.getDoc)(productRef);
        return { _id: id, id, ...updatedSnap.data() };
    },
    deleteProduct: async (id) => {
        const productRef = (0, firestore_1.doc)(firebase_1.db, 'products', id);
        await (0, firestore_1.deleteDoc)(productRef);
        return true;
    },
    decrementProductStock: async (id, quantity) => {
        const productRef = (0, firestore_1.doc)(firebase_1.db, 'products', id);
        await (0, firestore_1.updateDoc)(productRef, {
            stock: (0, firestore_1.increment)(-quantity),
            updatedAt: new Date().toISOString()
        });
        return true;
    },
    // --- CARTS ---
    getCart: async (cartId) => {
        const cartRef = (0, firestore_1.doc)(firebase_1.db, 'carts', cartId);
        const cartSnap = await (0, firestore_1.getDoc)(cartRef);
        if (!cartSnap.exists())
            return null;
        const cartData = cartSnap.data();
        const populatedItems = [];
        if (cartData.items && Array.isArray(cartData.items)) {
            for (const item of cartData.items) {
                const prodId = typeof item.product === 'object' ? (item.product._id || item.product.uid || item.product.id) : item.product;
                const productObj = await exports.dbService.getProductById(prodId);
                if (productObj) {
                    populatedItems.push({
                        product: productObj,
                        quantity: item.quantity
                    });
                }
            }
        }
        return {
            _id: cartSnap.id,
            id: cartSnap.id,
            ...cartData,
            items: populatedItems
        };
    },
    getCarts: async () => {
        const snap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'carts'));
        const cartsList = [];
        for (const d of snap.docs) {
            const cartData = d.data();
            const populatedItems = [];
            if (cartData.items && Array.isArray(cartData.items)) {
                for (const item of cartData.items) {
                    const prodId = typeof item.product === 'object' ? (item.product._id || item.product.uid || item.product.id) : item.product;
                    const productObj = await exports.dbService.getProductById(prodId);
                    if (productObj) {
                        populatedItems.push({
                            product: productObj,
                            quantity: item.quantity
                        });
                    }
                }
            }
            cartsList.push({
                _id: d.id,
                id: d.id,
                ...cartData,
                items: populatedItems
            });
        }
        return cartsList;
    },
    saveCart: async (cartData) => {
        const cartRef = (0, firestore_1.doc)(firebase_1.db, 'carts', cartData.cartId);
        const rawItems = [];
        if (cartData.items && Array.isArray(cartData.items)) {
            for (const item of cartData.items) {
                const prodId = typeof item.product === 'object' ? (item.product._id || item.product.uid || item.product.id) : item.product;
                rawItems.push({
                    product: prodId,
                    quantity: item.quantity
                });
            }
        }
        const docData = {
            ...cartData,
            updatedAt: new Date().toISOString()
        };
        if (cartData.items) {
            docData.items = rawItems;
        }
        delete docData._id;
        delete docData.id;
        Object.keys(docData).forEach(key => docData[key] === undefined && delete docData[key]);
        await (0, firestore_1.setDoc)(cartRef, docData, { merge: true });
        return await exports.dbService.getCart(cartData.cartId);
    },
    // --- RFID SCANS HISTORIES ---
    getRFIDScans: async () => {
        const rfidQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'rfidScans'), (0, firestore_1.orderBy)('timestamp', 'desc'));
        const snap = await (0, firestore_1.getDocs)(rfidQuery);
        return snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
    },
    addRFIDScan: async (scanData) => {
        const docData = {
            uid: scanData.uid,
            timestamp: scanData.timestamp ? new Date(scanData.timestamp).toISOString() : new Date().toISOString(),
            success: scanData.success || false,
            productName: scanData.productName || null
        };
        const docRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'rfidScans'), docData);
        return { _id: docRef.id, id: docRef.id, ...docData };
    },
    // --- TRANSACTIONS ---
    getTransactions: async (email) => {
        let txQuery;
        if (email) {
            txQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'transactions'), (0, firestore_1.where)('email', '==', email), (0, firestore_1.orderBy)('createdAt', 'desc'));
        }
        else {
            txQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'transactions'), (0, firestore_1.orderBy)('createdAt', 'desc'));
        }
        const snap = await (0, firestore_1.getDocs)(txQuery);
        return snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
    },
    createTransaction: async (txData) => {
        const transactionId = txData.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
        const txRef = (0, firestore_1.doc)(firebase_1.db, 'transactions', transactionId);
        const docData = {
            transactionId,
            orderNumber: txData.orderNumber || `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
            paymentMethod: txData.paymentMethod || 'Credit Card',
            customerName: txData.customerName,
            phone: txData.phone,
            email: txData.email,
            items: txData.items,
            totalPaid: txData.totalPaid,
            totalWeight: txData.totalWeight || 0,
            paymentStatus: txData.paymentStatus || 'Success',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await (0, firestore_1.setDoc)(txRef, docData);
        return { _id: transactionId, id: transactionId, ...docData };
    },
    // --- SHOPPING SESSIONS LOG ---
    createShoppingSession: async (sessionData) => {
        const sessionId = `SESS-${Math.floor(100000 + Math.random() * 900000)}`;
        const sessRef = (0, firestore_1.doc)(firebase_1.db, 'shoppingSessions', sessionId);
        const docData = {
            sessionId,
            cartId: sessionData.cartId,
            items: sessionData.items || [],
            budget: sessionData.budget || 0,
            totalAmount: sessionData.totalAmount || 0,
            expectedWeight: sessionData.expectedWeight || 0,
            physicalWeight: sessionData.physicalWeight || 0,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        await (0, firestore_1.setDoc)(sessRef, docData);
        return { _id: sessionId, id: sessionId, ...docData };
    },
    getShoppingSessions: async () => {
        const snap = await (0, firestore_1.getDocs)((0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'shoppingSessions'), (0, firestore_1.orderBy)('createdAt', 'desc')));
        return snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
    }
};
// Seed database helper
const seedMongoDatabase = async () => {
    try {
        const prodSnap = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'products'));
        if (prodSnap.size > 0) {
            console.log('Firebase Firestore already has products, skipping seeding...');
        }
        else {
            console.log('Seeding Firebase Firestore with 12 supermarket products...');
            const initialProducts = [
                { "uid": "F1CD0C01", "name": "Keeri Samba", "price": 1300, "weight": 5000, "stock": 100, "category": "Rice" },
                { "uid": "A5480D01", "name": "Maliban Chocolate Biscuit", "price": 240, "weight": 200, "stock": 100, "category": "Biscuits" },
                { "uid": "6BDC0D01", "name": "Choc Bis Maliban", "price": 450, "weight": 400, "stock": 100, "category": "Biscuits" },
                { "uid": "5DF03806", "name": "LUX Soap", "price": 170, "weight": 100, "stock": 100, "category": "Personal Care" },
                { "uid": "A4190D01", "name": "LUX Soap Legacy", "price": 170, "weight": 100, "stock": 100, "category": "Personal Care" },
                { "uid": "B6930D01", "name": "Brown Sugar", "price": 140, "weight": 500, "stock": 100, "category": "General" },
                { "uid": "BC740901", "name": "Sunlight Pwd", "price": 330, "weight": 1000, "stock": 100, "category": "Detergent" },
                { "uid": "8B450C01", "name": "Signal Paste", "price": 280, "weight": 160, "stock": 100, "category": "Personal Care" },
                { "uid": "E4320C01", "name": "Kottu Mee", "price": 135, "weight": 80, "stock": 100, "category": "Instant Food" },
                { "uid": "40ED8361", "name": "Yogurt Drink", "price": 160, "weight": 187, "stock": 100, "category": "Dairy" },
                { "uid": "CE410E01", "name": "Highland IceCrm", "price": 650, "weight": 550, "stock": 100, "category": "Ice Cream" }
            ];
            for (const p of initialProducts) {
                await exports.dbService.createProduct(p);
            }
            console.log('✨ Seeded 12 products successfully!');
        }
        // Seed default Users safely
        const customerSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'users', 'mock_uid_customer'));
        if (!customerSnap.exists()) {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'users', 'mock_uid_customer'), {
                firebaseId: 'mock_uid_customer',
                email: 'customer@smartcart.com',
                name: 'Smart Customer',
                role: 'customer',
                budgetLimit: 2000,
                budgetHistory: [{ date: new Date().toISOString(), limit: 2000 }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log('✨ Seeded test customer account: customer@smartcart.com / Customer123');
        }
        const adminSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'users', 'mock_uid_admin'));
        if (!adminSnap.exists()) {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'users', 'mock_uid_admin'), {
                firebaseId: 'mock_uid_admin',
                email: 'admin@smartcart.com',
                name: 'Smart Admin',
                role: 'admin',
                budgetLimit: 0,
                budgetHistory: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            console.log('✨ Seeded test admin account: admin@smartcart.com / Admin123');
        }
        console.log('✨ Firestore database seeding checks completed successfully!');
    }
    catch (err) {
        console.error('❌ Failed to seed Firebase database:', err.message);
    }
};
exports.seedMongoDatabase = seedMongoDatabase;
