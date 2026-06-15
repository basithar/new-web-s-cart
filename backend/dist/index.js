"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const dbService_1 = require("./services/dbService");
const api_1 = __importDefault(require("./routes/api"));
const socketService_1 = require("./services/socketService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Enable Cross-Origin Resource Sharing (CORS)
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permit local development, Vercel deployments, and physical hardware boards without origin headers
        if (!origin)
            return callback(null, true);
        if (origin.startsWith('http://localhost') ||
            origin.startsWith('http://127.0.0.1') ||
            origin === 'https://new-web-s-cart.vercel.app' ||
            origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
}));
// Express middleware for body parsing
app.use(express_1.default.json());
// Main App API routes endpoint mount
app.use('/api', api_1.default);
// Simple health-check router endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date(),
        service: 'Smart Shopping Cart IoT Platform API',
    });
});
// Configure Port
const PORT = process.env.PORT || 5000;
// Initialize Database connection and start server
const startServer = async () => {
    // Attempt DB connection
    const dbConnected = await (0, db_1.connectDB)();
    if (dbConnected) {
        // Seed initial mock items if using Firebase Firestore
        await (0, dbService_1.seedMongoDatabase)();
    }
    // Bind Socket.IO
    (0, socketService_1.initSocket)(server);
    console.log('🔌 Socket.IO event system initialized.');
    // Bind Server to Port
    server.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 Server running on: http://localhost:${PORT}`);
        console.log(`🏥 Health check at:  http://localhost:${PORT}/health`);
        console.log(`💾 Mode:             ${dbConnected ? 'Firebase Firestore Live' : 'In-Memory Mock Fallback'}`);
        console.log(`======================================================\n`);
    });
};
startServer().catch((err) => {
    console.error('💥 Fatal error starting server:', err);
    process.exit(1);
});
