import Product, { IProduct } from '../models/Product';
import User, { IUser } from '../models/User';
import Cart, { ICart } from '../models/Cart';
import Transaction, { ITransaction } from '../models/Transaction';
import RFIDScan, { IRFIDScan } from '../models/RFIDScan';
import { isInMemoryFallback } from '../config/db';

// --- IN-MEMORY DATABASE STORAGE ---
const memProducts: IProduct[] = [];
const memUsers: IUser[] = [];
const memCarts: ICart[] = [];
const memTransactions: ITransaction[] = [];
const memRFIDScans: IRFIDScan[] = [];

// Seed functions for in-memory arrays
const seedInMemoryData = () => {
  if (memProducts.length > 0) return;

  const mockProducts = [
    {
      rfidUid: 'RFID001',
      productName: 'Premium Milk',
      price: 450,
      weight: 1000,
      expiryDate: '2026-07-01',
      category: 'Dairy',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80',
      stockQuantity: 15,
    },
    {
      rfidUid: 'RFID002',
      productName: 'Fresh Bread',
      price: 250,
      weight: 400,
      expiryDate: '2026-06-15',
      category: 'Bakery',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
      stockQuantity: 20,
    },
    {
      rfidUid: 'RFID003',
      productName: 'Basmati Rice',
      price: 500,
      weight: 1000,
      expiryDate: '2027-01-01',
      category: 'Grains',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
      stockQuantity: 10,
    },
  ];

  mockProducts.forEach((p, idx) => {
    memProducts.push({
      _id: `prod_id_${idx + 1}`,
      id: `prod_id_${idx + 1}`,
      ...p,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
  });

  // Seed default demo users
  memUsers.push({
    _id: 'user_id_customer',
    firebaseId: 'mock_uid_customer',
    email: 'customer@smartcart.com',
    name: 'Smart Customer',
    role: 'customer',
    budgetLimit: 2000,
    budgetHistory: [
      { date: new Date(Date.now() - 86400000 * 2), limit: 1500 },
      { date: new Date(Date.now() - 86400000), limit: 2000 },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  memUsers.push({
    _id: 'user_id_admin',
    firebaseId: 'mock_uid_admin',
    email: 'admin@smartcart.com',
    name: 'Smart Admin',
    role: 'admin',
    budgetLimit: 0,
    budgetHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  // Seed default transaction history
  memTransactions.push({
    _id: 'tx_id_1',
    transactionId: 'TXN-982173',
    customerName: 'Smart Shopper',
    phone: '9876543210',
    email: 'shopper@smartcart.com',
    items: [
      { productName: 'Premium Milk', price: 450, quantity: 1 },
      { productName: 'Fresh Bread', price: 250, quantity: 2 },
    ],
    totalPaid: 950,
    totalWeight: 1800,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  } as any);

  // Seed default scans history
  memRFIDScans.push({
    _id: 'scan_id_1',
    uid: 'RFID001',
    timestamp: new Date(Date.now() - 3600000),
    success: true,
    productName: 'Premium Milk',
    createdAt: new Date(Date.now() - 3600000),
  } as any);

  memRFIDScans.push({
    _id: 'scan_id_2',
    uid: 'RFID_UNKNOWN_X',
    timestamp: new Date(Date.now() - 1800000),
    success: false,
    createdAt: new Date(Date.now() - 1800000),
  } as any);
};

// Execute seed data for in-memory DB arrays
seedInMemoryData();

export const dbService = {
  // --- USERS ---
  getUser: async (firebaseId: string): Promise<IUser | null> => {
    if (!isInMemoryFallback) {
      return await User.findOne({ firebaseId });
    }
    return memUsers.find((u) => u.firebaseId === firebaseId) || null;
  },

  getUsers: async (): Promise<IUser[]> => {
    if (!isInMemoryFallback) {
      return await User.find({});
    }
    return memUsers;
  },

  createUser: async (userData: Partial<IUser>): Promise<IUser> => {
    if (!isInMemoryFallback) {
      return await User.create(userData);
    }
    const newUser = {
      _id: `user_id_${memUsers.length + 1}`,
      firebaseId: userData.firebaseId,
      email: userData.email,
      name: userData.name,
      role: userData.role || 'customer',
      budgetLimit: userData.budgetLimit || 0,
      budgetHistory: userData.budgetHistory || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    memUsers.push(newUser);
    return newUser;
  },

  updateUserBudget: async (firebaseId: string, budgetLimit: number): Promise<IUser | null> => {
    if (!isInMemoryFallback) {
      return await User.findOneAndUpdate(
        { firebaseId },
        { 
          $set: { budgetLimit },
          $push: { budgetHistory: { date: new Date(), limit: budgetLimit } }
        },
        { new: true }
      );
    }
    const user = memUsers.find((u) => u.firebaseId === firebaseId);
    if (user) {
      user.budgetLimit = budgetLimit;
      user.budgetHistory.push({ date: new Date(), limit: budgetLimit });
      return user;
    }
    return null;
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<IProduct[]> => {
    if (!isInMemoryFallback) {
      return await Product.find({});
    }
    return memProducts;
  },

  getProductByRfid: async (rfidUid: string): Promise<IProduct | null> => {
    if (!isInMemoryFallback) {
      return await Product.findOne({ rfidUid });
    }
    return memProducts.find((p) => p.rfidUid === rfidUid) || null;
  },

  getProductById: async (id: string): Promise<IProduct | null> => {
    if (!isInMemoryFallback) {
      return await Product.findById(id);
    }
    return memProducts.find((p) => p._id.toString() === id || p.id === id) || null;
  },

  upsertProduct: async (productData: Partial<IProduct>): Promise<IProduct> => {
    if (!isInMemoryFallback) {
      if (productData._id) {
        return (await Product.findByIdAndUpdate(productData._id, productData, { new: true })) as IProduct;
      }
      return await Product.create(productData);
    }

    if (productData._id) {
      const idx = memProducts.findIndex((p) => p._id === productData._id);
      if (idx !== -1) {
        memProducts[idx] = { ...memProducts[idx], ...productData, updatedAt: new Date() } as any;
        return memProducts[idx];
      }
    }

    const newProd = {
      _id: `prod_id_${memProducts.length + 1}`,
      id: `prod_id_${memProducts.length + 1}`,
      rfidUid: productData.rfidUid,
      productName: productData.productName,
      price: productData.price,
      weight: productData.weight,
      expiryDate: productData.expiryDate,
      category: productData.category,
      image: productData.image,
      stockQuantity: productData.stockQuantity !== undefined ? Number(productData.stockQuantity) : 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    memProducts.push(newProd);
    return newProd;
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    if (!isInMemoryFallback) {
      const res = await Product.findByIdAndDelete(id);
      return res !== null;
    }
    const idx = memProducts.findIndex((p) => p._id.toString() === id || p.id === id);
    if (idx !== -1) {
      memProducts.splice(idx, 1);
      return true;
    }
    return false;
  },

  decrementProductStock: async (id: string, quantity: number): Promise<boolean> => {
    if (!isInMemoryFallback) {
      const res = await Product.findByIdAndUpdate(
        id,
        { $inc: { stockQuantity: -quantity } },
        { new: true }
      );
      return res !== null;
    }
    const idx = memProducts.findIndex((p) => p._id.toString() === id || p.id === id);
    if (idx !== -1) {
      memProducts[idx].stockQuantity = Math.max(0, memProducts[idx].stockQuantity - quantity);
      return true;
    }
    return false;
  },

  // --- CARTS ---
  getCart: async (cartId: string): Promise<ICart | null> => {
    if (!isInMemoryFallback) {
      return await Cart.findOne({ cartId }).populate('items.product');
    }
    const cart = memCarts.find((c) => c.cartId === cartId);
    if (!cart) return null;

    // Simulate population
    const populatedItems = cart.items.map((item) => {
      const productObj = memProducts.find((p) => p._id.toString() === (item.product as any).toString() || p.id === (item.product as any).toString());
      return {
        ...item,
        product: productObj || item.product,
      };
    });

    return {
      ...cart.toObject ? cart.toObject() : cart,
      items: populatedItems,
    } as any;
  },

  getCarts: async (): Promise<ICart[]> => {
    if (!isInMemoryFallback) {
      return await Cart.find({}).populate('items.product').sort({ updatedAt: -1 });
    }
    
    return memCarts.map((cart) => {
      const populatedItems = cart.items.map((item) => {
        const productObj = memProducts.find(
          (p) => p._id.toString() === (item.product as any).toString() || p.id === (item.product as any).toString()
        );
        return {
          ...item,
          product: productObj || item.product,
        };
      });
      return {
        ...cart.toObject ? cart.toObject() : cart,
        items: populatedItems,
      } as any;
    }).sort((a: any, b: any) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  saveCart: async (cartData: Partial<ICart>): Promise<ICart> => {
    if (!isInMemoryFallback) {
      return await Cart.findOneAndUpdate(
        { cartId: cartData.cartId },
        cartData,
        { new: true, upsert: true }
      ).populate('items.product');
    }

    let cart = memCarts.find((c) => c.cartId === cartData.cartId);
    if (cart) {
      Object.assign(cart, cartData, { updatedAt: new Date() });
    } else {
      cart = {
        _id: `cart_id_${memCarts.length + 1}`,
        cartId: cartData.cartId,
        userId: cartData.userId || '',
        items: cartData.items || [],
        budget: cartData.budget || 0,
        totalAmount: cartData.totalAmount || 0,
        expectedWeight: cartData.expectedWeight || 0,
        physicalWeight: cartData.physicalWeight || 0,
        weightMismatch: cartData.weightMismatch || false,
        status: cartData.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
      memCarts.push(cart as ICart);
    }

    // Populate for response
    const populatedItems = (cart as ICart).items.map((item) => {
      const productObj = memProducts.find((p) => p._id.toString() === (item.product as any).toString() || p.id === (item.product as any).toString());
      return {
        ...item,
        product: productObj || item.product,
      };
    });

    return {
      ...cart,
      items: populatedItems,
    } as any;
  },

  // --- RFID SCANS HISTORIES ---
  getRFIDScans: async (): Promise<IRFIDScan[]> => {
    if (!isInMemoryFallback) {
      return await RFIDScan.find({}).sort({ timestamp: -1 });
    }
    return [...memRFIDScans].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  addRFIDScan: async (scanData: Partial<IRFIDScan>): Promise<IRFIDScan> => {
    if (!isInMemoryFallback) {
      return await RFIDScan.create(scanData);
    }
    const newScan = {
      _id: `scan_id_${memRFIDScans.length + 1}`,
      uid: scanData.uid,
      timestamp: scanData.timestamp || new Date(),
      success: scanData.success || false,
      productName: scanData.productName,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    memRFIDScans.push(newScan);
    return newScan;
  },

  // --- TRANSACTIONS ---
  getTransactions: async (email?: string): Promise<ITransaction[]> => {
    if (!isInMemoryFallback) {
      const query = email ? { email } : {};
      return await Transaction.find(query).sort({ createdAt: -1 });
    }
    const txs = email ? memTransactions.filter((t) => t.email === email) : memTransactions;
    return [...txs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  createTransaction: async (txData: Partial<ITransaction>): Promise<ITransaction> => {
    if (!isInMemoryFallback) {
      return await Transaction.create(txData);
    }

    const newTx = {
      _id: `tx_id_${memTransactions.length + 1}`,
      transactionId: txData.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      orderNumber: txData.orderNumber || `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentMethod: txData.paymentMethod || 'Credit Card',
      customerName: txData.customerName,
      phone: txData.phone,
      email: txData.email,
      items: txData.items,
      totalPaid: txData.totalPaid,
      totalWeight: txData.totalWeight || 0,
      paymentStatus: txData.paymentStatus || 'Success',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    memTransactions.push(newTx);
    return newTx;
  },
};

// Run seed database helper if using MongoDB Live Connection
export const seedMongoDatabase = async () => {
  if (isInMemoryFallback) return;

  try {
    const prodCount = await Product.countDocuments();
    if (prodCount > 0) {
      console.log('MongoDB already has products, skipping seeding...');
      return;
    }

    console.log('Seeding MongoDB with supermarket mock products (Milk, Bread, Rice)...');
    const mockProducts = [
      {
        rfidUid: 'RFID001',
        productName: 'Premium Milk',
        price: 450,
        weight: 1000,
        expiryDate: '2026-07-01',
        category: 'Dairy',
        image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&auto=format&fit=crop&q=80',
        stockQuantity: 15,
      },
      {
        rfidUid: 'RFID002',
        productName: 'Fresh Bread',
        price: 250,
        weight: 400,
        expiryDate: '2026-06-15',
        category: 'Bakery',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80',
        stockQuantity: 20,
      },
      {
        rfidUid: 'RFID003',
        productName: 'Basmati Rice',
        price: 500,
        weight: 1000,
        expiryDate: '2027-01-01',
        category: 'Grains',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
        stockQuantity: 10,
      },
    ];

    await Product.insertMany(mockProducts);
    
    // Seed default Users safely if they do not exist
    const customerExists = await User.findOne({ email: 'customer@smartcart.com' });
    if (!customerExists) {
      await User.create({
        firebaseId: 'mock_uid_customer',
        email: 'customer@smartcart.com',
        name: 'Smart Customer',
        role: 'customer',
        budgetLimit: 2000,
        budgetHistory: [{ date: new Date(), limit: 2000 }]
      });
    }

    const adminExists = await User.findOne({ email: 'admin@smartcart.com' });
    if (!adminExists) {
      await User.create({
        firebaseId: 'mock_uid_admin',
        email: 'admin@smartcart.com',
        name: 'Smart Admin',
        role: 'admin',
        budgetLimit: 0,
        budgetHistory: []
      });
    }

    console.log('✨ MongoDB seeded successfully!');
  } catch (err: any) {
    console.error('❌ Failed to seed MongoDB database:', err.message);
  }
};
