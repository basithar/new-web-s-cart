"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedMongoDatabase = exports.dbService = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const User_1 = __importDefault(require("../models/User"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
const RFIDScan_1 = __importDefault(require("../models/RFIDScan"));
exports.dbService = {
    // --- USERS ---
    getUser: async (firebaseId) => {
        return await User_1.default.findOne({ firebaseId });
    },
    getUsers: async () => {
        return await User_1.default.find({});
    },
    createUser: async (userData) => {
        return await User_1.default.create(userData);
    },
    updateUserBudget: async (firebaseId, budgetLimit) => {
        return await User_1.default.findOneAndUpdate({ firebaseId }, {
            $set: { budgetLimit },
            $push: { budgetHistory: { date: new Date(), limit: budgetLimit } }
        }, { new: true });
    },
    // --- PRODUCTS ---
    getProducts: async () => {
        return await Product_1.default.find({});
    },
    getProductByRfid: async (uid) => {
        return await Product_1.default.findOne({ uid });
    },
    getProductById: async (id) => {
        return await Product_1.default.findById(id);
    },
    createProduct: async (productData) => {
        return await Product_1.default.create(productData);
    },
    updateProduct: async (id, productData) => {
        return await Product_1.default.findByIdAndUpdate(id, productData, { new: true });
    },
    deleteProduct: async (id) => {
        const res = await Product_1.default.findByIdAndDelete(id);
        return res !== null;
    },
    decrementProductStock: async (id, quantity) => {
        const res = await Product_1.default.findByIdAndUpdate(id, { $inc: { stock: -quantity } }, { new: true });
        return res !== null;
    },
    // --- CARTS ---
    getCart: async (cartId) => {
        return await Cart_1.default.findOne({ cartId }).populate('items.product');
    },
    getCarts: async () => {
        return await Cart_1.default.find({}).populate('items.product').sort({ updatedAt: -1 });
    },
    saveCart: async (cartData) => {
        return await Cart_1.default.findOneAndUpdate({ cartId: cartData.cartId }, cartData, { new: true, upsert: true }).populate('items.product');
    },
    // --- RFID SCANS HISTORIES ---
    getRFIDScans: async () => {
        return await RFIDScan_1.default.find({}).sort({ timestamp: -1 });
    },
    addRFIDScan: async (scanData) => {
        return await RFIDScan_1.default.create(scanData);
    },
    // --- TRANSACTIONS ---
    getTransactions: async (email) => {
        const query = email ? { email } : {};
        return await Transaction_1.default.find(query).sort({ createdAt: -1 });
    },
    createTransaction: async (txData) => {
        return await Transaction_1.default.create(txData);
    },
};
// Seed database helper
const seedMongoDatabase = async () => {
    try {
        const prodCount = await Product_1.default.countDocuments();
        if (prodCount > 0) {
            console.log('MongoDB already has products, skipping seeding...');
        }
        else {
            console.log('Seeding MongoDB with 12 supermarket products...');
            const initialProducts = [
                {
                    "uid": "F1CD0C01",
                    "name": "Keeri Samba",
                    "price": 1300,
                    "weight": 5000,
                    "stock": 100,
                    "category": "Rice"
                },
                {
                    "uid": "A5480D01",
                    "name": "Anchor Milk",
                    "price": 1150,
                    "weight": 400,
                    "stock": 100,
                    "category": "Milk Powder"
                },
                {
                    "uid": "6BDC0D01",
                    "name": "Choc Bis Maliban",
                    "price": 450,
                    "weight": 400,
                    "stock": 100,
                    "category": "Biscuits"
                },
                {
                    "uid": "5DF03806",
                    "name": "Munchee Puff",
                    "price": 130,
                    "weight": 100,
                    "stock": 100,
                    "category": "Snacks"
                },
                {
                    "uid": "A4190D01",
                    "name": "LUX Soap",
                    "price": 170,
                    "weight": 100,
                    "stock": 100,
                    "category": "Personal Care"
                },
                {
                    "uid": "BC740901",
                    "name": "Sunlight Pwd",
                    "price": 330,
                    "weight": 1000,
                    "stock": 100,
                    "category": "Detergent"
                },
                {
                    "uid": "8B450C01",
                    "name": "Signal Paste",
                    "price": 280,
                    "weight": 160,
                    "stock": 100,
                    "category": "Personal Care"
                },
                {
                    "uid": "E4320C01",
                    "name": "Kottu Mee",
                    "price": 135,
                    "weight": 80,
                    "stock": 100,
                    "category": "Instant Food"
                },
                {
                    "uid": "01320D01",
                    "name": "Coca Cola",
                    "price": 420,
                    "weight": 1560,
                    "stock": 100,
                    "category": "Beverages"
                },
                {
                    "uid": "40ED8361",
                    "name": "Yogurt Drink",
                    "price": 160,
                    "weight": 187,
                    "stock": 100,
                    "category": "Dairy"
                },
                {
                    "uid": "71FE0C01",
                    "name": "Ritzbury",
                    "price": 250,
                    "weight": 110,
                    "stock": 100,
                    "category": "Chocolate"
                },
                {
                    "uid": "CE410E01",
                    "name": "Highland IceCrm",
                    "price": 650,
                    "weight": 550,
                    "stock": 100,
                    "category": "Ice Cream"
                }
            ];
            await Product_1.default.insertMany(initialProducts);
            console.log('✨ Seeded 12 products successfully!');
        }
        // Seed default Users safely if they do not exist
        const customerExists = await User_1.default.findOne({ email: 'customer@smartcart.com' });
        if (!customerExists) {
            await User_1.default.create({
                firebaseId: 'mock_uid_customer',
                email: 'customer@smartcart.com',
                name: 'Smart Customer',
                role: 'customer',
                budgetLimit: 2000,
                budgetHistory: [{ date: new Date(), limit: 2000 }]
            });
            console.log('✨ Seeded test customer account: customer@smartcart.com / Customer123');
        }
        const adminExists = await User_1.default.findOne({ email: 'admin@smartcart.com' });
        if (!adminExists) {
            await User_1.default.create({
                firebaseId: 'mock_uid_admin',
                email: 'admin@smartcart.com',
                name: 'Smart Admin',
                role: 'admin',
                budgetLimit: 0,
                budgetHistory: []
            });
            console.log('✨ Seeded test admin account: admin@smartcart.com / Admin123');
        }
        console.log('✨ Database seeding checks completed successfully!');
    }
    catch (err) {
        console.error('❌ Failed to seed MongoDB database:', err.message);
    }
};
exports.seedMongoDatabase = seedMongoDatabase;
