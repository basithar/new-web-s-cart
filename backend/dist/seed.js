"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const dbService_1 = require("./services/dbService");
const mongoose_1 = __importDefault(require("mongoose"));
const runSeed = async () => {
    console.log('Starting seed command...');
    const success = await (0, db_1.connectDB)();
    if (success) {
        await (0, dbService_1.seedMongoDatabase)();
    }
    else {
        console.log('Skipping MongoDB seeding (in-memory mode is auto-seeded at runtime).');
    }
    await mongoose_1.default.disconnect();
    console.log('Seeding process finished.');
};
runSeed();
