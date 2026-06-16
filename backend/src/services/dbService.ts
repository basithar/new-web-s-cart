import { 
  doc, getDoc, getDocs, collection, setDoc, updateDoc, 
  deleteDoc, addDoc, query, where, limit, orderBy, increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

const getProductImagePreset = (category: string): string => {
  const mapping: { [key: string]: string } = {
    'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
    'Milk Powder': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80',
    'Biscuits': 'https://images.unsplash.com/photo-1558961309-dbdf71799f18?w=300&auto=format&fit=crop&q=80',
    'Snacks': 'https://images.unsplash.com/photo-1599490659283-4462babb6c31?w=300&auto=format&fit=crop&q=80',
    'Personal Care': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
    'Soap': 'https://images.unsplash.com/photo-1607006342411-9a3363d63b36?w=300&auto=format&fit=crop&q=80',
    'Toothpaste': 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=300&auto=format&fit=crop&q=80',
    'Tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=80',
    'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&auto=format&fit=crop&q=80',
    'Margarine': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80',
    'Sauce': 'https://images.unsplash.com/photo-1607305387299-a3d9611cd46f?w=300&auto=format&fit=crop&q=80',
    'Instant Food': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&auto=format&fit=crop&q=80',
    'Beverages': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&auto=format&fit=crop&q=80',
    'Dairy': 'https://images.unsplash.com/photo-1528750955906-79c2409f3e7e?w=300&auto=format&fit=crop&q=80',
    'Chocolate': 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=300&auto=format&fit=crop&q=80',
    'Ice Cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&auto=format&fit=crop&q=80',
    'Detergent': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
  };
  return mapping[category] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
};

export const dbService = {
  // --- USERS ---
  getUser: async (firebaseId: string): Promise<any | null> => {
    const userRef = doc(db, 'users', firebaseId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? { _id: userSnap.id, id: userSnap.id, ...userSnap.data() } : null;
  },

  getUsers: async (): Promise<any[]> => {
    const usersSnap = await getDocs(collection(db, 'users'));
    return usersSnap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
  },

  createUser: async (userData: any): Promise<any> => {
    const firebaseId = userData.firebaseId;
    if (!firebaseId) throw new Error('Missing firebaseId');
    const userRef = doc(db, 'users', firebaseId);
    const docData = {
      ...userData,
      budgetLimit: userData.budgetLimit || 0,
      budgetHistory: userData.budgetHistory || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(userRef, docData);
    return { _id: firebaseId, id: firebaseId, ...docData };
  },

  updateUserBudget: async (firebaseId: string, budgetLimit: number): Promise<any | null> => {
    const userRef = doc(db, 'users', firebaseId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    const currentData = userSnap.data();
    const budgetHistory = currentData.budgetHistory || [];
    budgetHistory.push({ date: new Date().toISOString(), limit: budgetLimit });
    await updateDoc(userRef, {
      budgetLimit,
      budgetHistory,
      updatedAt: new Date().toISOString()
    });
    return { _id: firebaseId, id: firebaseId, ...currentData, budgetLimit, budgetHistory };
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<any[]> => {
    const snap = await getDocs(collection(db, 'products'));
    return snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
  },

  getProductByRfid: async (uid: string): Promise<any | null> => {
    const productRef = doc(db, 'products', uid);
    const productSnap = await getDoc(productRef);
    return productSnap.exists() ? { _id: productSnap.id, id: productSnap.id, ...productSnap.data() } : null;
  },

  getProductById: async (id: string): Promise<any | null> => {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    return productSnap.exists() ? { _id: productSnap.id, id: productSnap.id, ...productSnap.data() } : null;
  },

  createProduct: async (productData: any): Promise<any> => {
    const uid = productData.uid;
    if (!uid) throw new Error('Missing uid');
    const productRef = doc(db, 'products', uid);
    const category = productData.category || 'General';
    const imageUrlPreset = getProductImagePreset(category);
    const docData = {
      uid,
      name: productData.name,
      price: Number(productData.price),
      weight: Number(productData.weight),
      stock: productData.stock !== undefined ? Number(productData.stock) : 100,
      category,
      imageUrl: productData.imageUrl || imageUrlPreset,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(productRef, docData);
    return { _id: uid, id: uid, ...docData };
  },

  updateProduct: async (id: string, productData: any): Promise<any | null> => {
    const productRef = doc(db, 'products', id);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) return null;
    const docData = {
      ...productData,
      price: productData.price !== undefined ? Number(productData.price) : undefined,
      weight: productData.weight !== undefined ? Number(productData.weight) : undefined,
      stock: productData.stock !== undefined ? Number(productData.stock) : undefined,
      updatedAt: new Date().toISOString()
    };
    Object.keys(docData).forEach(key => docData[key] === undefined && delete docData[key]);
    await updateDoc(productRef, docData);
    const updatedSnap = await getDoc(productRef);
    return { _id: id, id, ...updatedSnap.data() };
  },

  deleteProduct: async (id: string): Promise<boolean> => {
    const productRef = doc(db, 'products', id);
    await deleteDoc(productRef);
    return true;
  },

  decrementProductStock: async (id: string, quantity: number): Promise<boolean> => {
    const productRef = doc(db, 'products', id);
    await updateDoc(productRef, {
      stock: increment(-quantity),
      updatedAt: new Date().toISOString()
    });
    return true;
  },

  // --- CARTS ---
  getCart: async (cartId: string): Promise<any | null> => {
    const cartRef = doc(db, 'carts', cartId);
    const cartSnap = await getDoc(cartRef);
    if (!cartSnap.exists()) return null;
    const cartData = cartSnap.data() as any;
    
    const populatedItems = [];
    if (cartData.items && Array.isArray(cartData.items)) {
      for (const item of cartData.items) {
        const prodId = typeof item.product === 'object' ? (item.product._id || item.product.uid || item.product.id) : item.product;
        const productObj = await dbService.getProductById(prodId);
        if (productObj) {
          populatedItems.push({
            product: productObj,
            quantity: item.quantity
          });
        }
      }
    }
    
    return {
      _id: cartSnap.id,
      id: cartSnap.id,
      ...cartData,
      items: populatedItems
    };
  },

  getCarts: async (): Promise<any[]> => {
    const snap = await getDocs(collection(db, 'carts'));
    const cartsList = [];
    for (const d of snap.docs) {
      const cartData = d.data();
      const populatedItems = [];
      if (cartData.items && Array.isArray(cartData.items)) {
        for (const item of cartData.items) {
          const prodId = typeof item.product === 'object' ? (item.product._id || item.product.uid || item.product.id) : item.product;
          const productObj = await dbService.getProductById(prodId);
          if (productObj) {
            populatedItems.push({
              product: productObj,
              quantity: item.quantity
            });
          }
        }
      }
      cartsList.push({
        _id: d.id,
        id: d.id,
        ...cartData,
        items: populatedItems
      });
    }
    return cartsList;
  },

  saveCart: async (cartData: any): Promise<any> => {
    const cartRef = doc(db, 'carts', cartData.cartId);
    const rawItems = [];
    if (cartData.items && Array.isArray(cartData.items)) {
      for (const item of cartData.items) {
        const prodId = typeof item.product === 'object' ? (item.product._id || item.product.uid || item.product.id) : item.product;
        rawItems.push({
          product: prodId,
          quantity: item.quantity
        });
      }
    }
    
    const docData: any = {
      ...cartData,
      updatedAt: new Date().toISOString()
    };
    if (cartData.items) {
      docData.items = rawItems;
    }
    delete docData._id;
    delete docData.id;
    
    Object.keys(docData).forEach(key => docData[key] === undefined && delete docData[key]);
    
    await setDoc(cartRef, docData, { merge: true });
    return await dbService.getCart(cartData.cartId);
  },

  // --- RFID SCANS HISTORIES ---
  getRFIDScans: async (): Promise<any[]> => {
    const rfidQuery = query(collection(db, 'rfidScans'), orderBy('timestamp', 'desc'));
    const snap = await getDocs(rfidQuery);
    return snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
  },

  addRFIDScan: async (scanData: any): Promise<any> => {
    const docData = {
      uid: scanData.uid,
      timestamp: scanData.timestamp ? new Date(scanData.timestamp).toISOString() : new Date().toISOString(),
      success: scanData.success || false,
      productName: scanData.productName || null
    };
    const docRef = await addDoc(collection(db, 'rfidScans'), docData);
    return { _id: docRef.id, id: docRef.id, ...docData };
  },

  // --- TRANSACTIONS ---
  getTransactions: async (email?: string): Promise<any[]> => {
    let txQuery;
    if (email) {
      txQuery = query(collection(db, 'transactions'), where('email', '==', email), orderBy('createdAt', 'desc'));
    } else {
      txQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(txQuery);
    return snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
  },

  createTransaction: async (txData: any): Promise<any> => {
    const transactionId = txData.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const txRef = doc(db, 'transactions', transactionId);
    const docData = {
      transactionId,
      orderNumber: txData.orderNumber || `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      paymentMethod: txData.paymentMethod || 'Credit Card',
      customerName: txData.customerName,
      phone: txData.phone,
      email: txData.email,
      items: txData.items,
      totalPaid: txData.totalPaid,
      totalWeight: txData.totalWeight || 0,
      paymentStatus: txData.paymentStatus || 'Success',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(txRef, docData);
    return { _id: transactionId, id: transactionId, ...docData };
  },

  // --- SHOPPING SESSIONS LOG ---
  createShoppingSession: async (sessionData: any): Promise<any> => {
    const sessionId = `SESS-${Math.floor(100000 + Math.random() * 900000)}`;
    const sessRef = doc(db, 'shoppingSessions', sessionId);
    const docData = {
      sessionId,
      cartId: sessionData.cartId,
      items: sessionData.items || [],
      budget: sessionData.budget || 0,
      totalAmount: sessionData.totalAmount || 0,
      expectedWeight: sessionData.expectedWeight || 0,
      physicalWeight: sessionData.physicalWeight || 0,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
    await setDoc(sessRef, docData);
    return { _id: sessionId, id: sessionId, ...docData };
  },

  getShoppingSessions: async (): Promise<any[]> => {
    const snap = await getDocs(query(collection(db, 'shoppingSessions'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
  }
};

// Seed database helper
export const seedMongoDatabase = async () => {
  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.size > 0) {
      console.log('Firebase Firestore already has products, skipping seeding...');
    } else {
      console.log('Seeding Firebase Firestore with 12 supermarket products...');
      const initialProducts = [
        {"uid":"F1CD0C01","name":"Keeri Samba","price":1300,"weight":5000,"stock":100,"category":"Rice"},
        {"uid":"A5480D01","name":"Maliban Biscuit","price":240,"weight":200,"stock":100,"category":"Biscuits"},
        {"uid":"6BDC0D01","name":"Ritzbury","price":450,"weight":400,"stock":100,"category":"Biscuits"},
        {"uid":"5DF03806","name":"LUX Soap","price":170,"weight":100,"stock":100,"category":"Personal Care"},
        {"uid":"B6930D01","name":"Brown Sugar","price":140,"weight":500,"stock":100,"category":"General"},
        {"uid":"8B450C01","name":"Signal Paste","price":280,"weight":160,"stock":100,"category":"Personal Care"},
        {"uid":"E4320C01","name":"Kottu Mee","price":135,"weight":80,"stock":100,"category":"Instant Food"},
        {"uid":"CE410E01","name":"Highland IceCrm","price":650,"weight":550,"stock":100,"category":"Ice Cream"}
      ];

      for (const p of initialProducts) {
        await dbService.createProduct(p);
      }
      console.log('✨ Seeded products successfully!');
    }

    // Seed default Users safely
    const customerSnap = await getDoc(doc(db, 'users', 'mock_uid_customer'));
    if (!customerSnap.exists()) {
      await setDoc(doc(db, 'users', 'mock_uid_customer'), {
        firebaseId: 'mock_uid_customer',
        email: 'customer@smartcart.com',
        name: 'Mr.B Smart Customer',
        role: 'customer',
        budgetLimit: 2000,
        budgetHistory: [{ date: new Date().toISOString(), limit: 2000 }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✨ Seeded test customer account: customer@smartcart.com / Customer123');
    }

    const adminSnap = await getDoc(doc(db, 'users', 'mock_uid_admin'));
    if (!adminSnap.exists()) {
      await setDoc(doc(db, 'users', 'mock_uid_admin'), {
        firebaseId: 'mock_uid_admin',
        email: 'admin@smartcart.com',
        name: 'Smart Admin',
        role: 'admin',
        budgetLimit: 0,
        budgetHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✨ Seeded test admin account: admin@smartcart.com / Admin123');
    }

    console.log('✨ Firestore database seeding checks completed successfully!');
  } catch (err: any) {
    console.error('❌ Failed to seed Firebase database:', err.message);
  }
};
