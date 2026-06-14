"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const dbService_1 = require("./services/dbService");
const runSeed = async () => {
    console.log('Starting seed command...');
    const success = await (0, db_1.connectDB)();
    if (success) {
        await (0, dbService_1.seedMongoDatabase)();
    }
    else {
        console.error('Skipping Firestore seeding: database connection failed.');
    }
    console.log('Seeding process finished.');
    process.exit(0);
};
runSeed();
