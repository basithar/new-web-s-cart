import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: '*', // For demo compatibility, allow all origins
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join_cart', (cartId: string) => {
      socket.join(cartId);
      console.log(`🛒 Client ${socket.id} joined cart room: ${cartId}`);
    });

    socket.on('leave_cart', (cartId: string) => {
      socket.leave(cartId);
      console.log(`🛒 Client ${socket.id} left cart room: ${cartId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO is not initialized! Call initSocket first.');
  }
  return io;
};

export const emitCartUpdate = (cartId: string, cartData: any) => {
  if (io) {
    io.to(cartId).emit('cart_updated', cartData);
    // Also emit a general update to all listeners for administrative visibility
    io.emit('admin_cart_updated', cartData);
  }
};

export const emitSecurityAlert = (alertData: any) => {
  if (io) {
    io.emit('security_alert', alertData);
  }
};

export const emitInventoryUpdate = (productData: any) => {
  if (io) {
    io.emit('inventory_updated', productData);
  }
};

export const emitNotification = (notification: { type: string; title: string; message: string }) => {
  if (io) {
    io.emit('notification', notification);
  }
};
