"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNotification = exports.emitInventoryUpdate = exports.emitSecurityAlert = exports.emitCheckoutStatus = exports.emitCartUpdate = exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // For demo compatibility, allow all origins
            methods: ['GET', 'POST'],
        },
    });
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        socket.on('join_cart', (cartId) => {
            socket.join(cartId);
            console.log(`🛒 Client ${socket.id} joined cart room: ${cartId}`);
        });
        socket.on('leave_cart', (cartId) => {
            socket.leave(cartId);
            console.log(`🛒 Client ${socket.id} left cart room: ${cartId}`);
        });
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO is not initialized! Call initSocket first.');
    }
    return io;
};
exports.getIO = getIO;
const emitCartUpdate = (cartId, cartData) => {
    if (io) {
        io.to(cartId).emit('cart_updated', cartData);
        // Also emit a general update to all listeners for administrative visibility
        io.emit('admin_cart_updated', cartData);
    }
};
exports.emitCartUpdate = emitCartUpdate;
const emitCheckoutStatus = (cartId, statusData) => {
    if (io) {
        io.to(cartId).emit('checkout_status', statusData);
        io.emit('checkout_status', statusData); // Emit globally for visibility
    }
};
exports.emitCheckoutStatus = emitCheckoutStatus;
const emitSecurityAlert = (alertData) => {
    if (io) {
        io.emit('security_alert', alertData);
    }
};
exports.emitSecurityAlert = emitSecurityAlert;
const emitInventoryUpdate = (productData) => {
    if (io) {
        io.emit('inventory_updated', productData);
    }
};
exports.emitInventoryUpdate = emitInventoryUpdate;
const emitNotification = (notification) => {
    if (io) {
        io.emit('notification', notification);
    }
};
exports.emitNotification = emitNotification;
