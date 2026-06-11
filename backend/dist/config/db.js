"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.isInMemoryFallback = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.isInMemoryFallback = false;
const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartcart';
    console.log('Connecting to database...');
    try {
        // Set connection timeout to 4 seconds so it falls back quickly if MongoDB isn't running
        await mongoose_1.default.connect(mongoURI, {
            serverSelectionTimeoutMS: 4000,
        });
        console.log('✨ MongoDB Connected successfully!');
        exports.isInMemoryFallback = false;
        return true;
    }
    catch (error) {
        console.warn('⚠️ MongoDB connection failed. Reason:', error.message);
        console.warn('🚀 Falling back to fully-functional IN-MEMORY DATABASE for demonstration!');
        exports.isInMemoryFallback = true;
        return false;
    }
};
exports.connectDB = connectDB;
