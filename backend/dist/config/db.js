"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.isInMemoryFallback = void 0;
const firebase_1 = require("./firebase");
exports.isInMemoryFallback = false;
const connectDB = async () => {
    try {
        if (!firebase_1.db) {
            throw new Error('Firestore DB instance is not initialized.');
        }
        console.log('✨ Firebase Firestore connection verified successfully!');
        exports.isInMemoryFallback = false;
        return true;
    }
    catch (error) {
        console.error('❌ Firebase Firestore verification failed:', error.message);
        exports.isInMemoryFallback = false;
        return false;
    }
};
exports.connectDB = connectDB;
