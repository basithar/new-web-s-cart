import Product, { IProduct } from '../models/Product';
import User, { IUser } from '../models/User';
import Cart, { ICart } from '../models/Cart';
import Transaction, { ITransaction } from '../models/Transaction';
import RFIDScan, { IRFIDScan } from '../models/RFIDScan';

export const dbService = {
  // --- USERS ---
  getUser: async (firebaseId: string): Promise<IUser | null> => {
    return await User.findOne({ firebaseId });
  },

  getUsers: async (): Promise<IUser[]> => {
    return await User.find({});
  },

  createUser: async (userData: Partial<IUser>): Promise<IUser> => {
    return await User.create(userData);
  },

  updateUserBudget: async (firebaseId: string, budgetLimit: number): Promise<IUser | null> => {
    return await User.findOneAndUpdate(
      { firebaseId },
      { 
        $set: { budgetLimit },
        $push: { budgetHistory: { date: new Date(), limit: budgetLimit } }
      },
      { new: true }
    );
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<IProduct[]> => {
    return await Product.find({});
  },

  getProductByRfid: async (uid: string): Promise<IProduct | null> => {
    return await Product.findOne({ uid });
  },

  getProductById: async (id: string): Promise<IProduct | null> => {
    return await Product.findById(id);
  },

  createProduct: async (productData: Partial<IProduct>): Promise<IProduct> => {
    return await Product.create(productData);
  },

  updateProduct: async (id: string, productData: Partial<IProduct>): Promise<IProduct | null> => {
    return await Product.findByIdAndUpdate(id, productData, { new: true });
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const res = await Product.findByIdAndDelete(id);
    return res !== null;
  },

  decrementProductStock: async (id: string, quantity: number): Promise<boolean> => {
    const res = await Product.findByIdAndUpdate(
      id,
      { $inc: { stock: -quantity } },
      { new: true }
    );
    return res !== null;
  },

  // --- CARTS ---
  getCart: async (cartId: string): Promise<ICart | null> => {
    return await Cart.findOne({ cartId }).populate('items.product');
  },

  getCarts: async (): Promise<ICart[]> => {
    return await Cart.find({}).populate('items.product').sort({ updatedAt: -1 });
  },

  saveCart: async (cartData: Partial<ICart>): Promise<ICart> => {
    return await Cart.findOneAndUpdate(
      { cartId: cartData.cartId },
      cartData,
      { new: true, upsert: true }
    ).populate('items.product');
  },

  // --- RFID SCANS HISTORIES ---
  getRFIDScans: async (): Promise<IRFIDScan[]> => {
    return await RFIDScan.find({}).sort({ timestamp: -1 });
  },

  addRFIDScan: async (scanData: Partial<IRFIDScan>): Promise<IRFIDScan> => {
    return await RFIDScan.create(scanData);
  },

  // --- TRANSACTIONS ---
  getTransactions: async (email?: string): Promise<ITransaction[]> => {
    const query = email ? { email } : {};
    return await Transaction.find(query).sort({ createdAt: -1 });
  },

  createTransaction: async (txData: Partial<ITransaction>): Promise<ITransaction> => {
    return await Transaction.create(txData);
  },
};

// Seed database helper
export const seedMongoDatabase = async () => {
  try {
    const prodCount = await Product.countDocuments();
    if (prodCount > 0) {
      console.log('MongoDB already has products, skipping seeding...');
    } else {
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
      await Product.insertMany(initialProducts);
      console.log('✨ Seeded 12 products successfully!');
    }

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
      console.log('✨ Seeded test customer account: customer@smartcart.com / Customer123');
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
      console.log('✨ Seeded test admin account: admin@smartcart.com / Admin123');
    }

    console.log('✨ Database seeding checks completed successfully!');
  } catch (err: any) {
    console.error('❌ Failed to seed MongoDB database:', err.message);
  }
};
