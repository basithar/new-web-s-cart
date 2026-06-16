import { connectDB } from './config/db';
import { db } from './config/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const updateProducts = async () => {
  console.log('Connecting to database...');
  const success = await connectDB();
  if (!success) {
    console.error('Failed to connect to database.');
    process.exit(1);
  }

  const itemsToDelete = ['03120D01', '40ED8361'];
  for (const uid of itemsToDelete) {
    console.log(`Deleting product: ${uid}`);
    try {
      await deleteDoc(doc(db, 'products', uid));
    } catch (err: any) {
      console.error(`Failed to delete ${uid}:`, err.message);
    }
  }

  const itemsToUpsert = [
    { uid: 'F1CD0C01', name: 'Keeri Samba', price: 1300, weight: 5000, stock: 100, category: 'Rice', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300' },
    { uid: 'A5480D01', name: 'Maliban Biscuit', price: 240, weight: 200, stock: 100, category: 'Biscuits', imageUrl: 'https://images.unsplash.com/photo-1558961309-dbdf71799f18?w=300' },
    { uid: '6BDC0D01', name: 'Ritzbury', price: 450, weight: 400, stock: 100, category: 'Biscuits', imageUrl: 'https://images.unsplash.com/photo-1558961309-dbdf71799f18?w=300' },
    { uid: '5DF03806', name: 'LUX Soap', price: 170, weight: 100, stock: 100, category: 'Personal Care', imageUrl: 'https://images.unsplash.com/photo-1607006342411-9a3363d63b36?w=300' },
    { uid: 'B6930D01', name: 'Brown Sugar', price: 140, weight: 500, stock: 100, category: 'General', imageUrl: 'https://images.unsplash.com/photo-1596450514966-a12b3b01be7f?w=300' },
    { uid: '8B450C01', name: 'Signal Paste', price: 280, weight: 160, stock: 100, category: 'Personal Care', imageUrl: 'https://images.unsplash.com/photo-1559599189-fe84dea4eb79?w=300' },
    { uid: 'E4320C01', name: 'Kottu Mee', price: 135, weight: 80, stock: 100, category: 'Instant Food', imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300' },
    { uid: 'CE410E01', name: 'Highland IceCrm', price: 650, weight: 550, stock: 100, category: 'Ice Cream', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300' }
  ];

  for (const p of itemsToUpsert) {
    console.log(`Upserting product: ${p.name} (${p.uid})`);
    try {
      await setDoc(doc(db, 'products', p.uid), {
        uid: p.uid,
        name: p.name,
        price: p.price,
        weight: p.weight,
        stock: p.stock,
        category: p.category,
        imageUrl: p.imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error(`Failed to upsert ${p.name}:`, err.message);
    }
  }

  // Also update the seed user mock name in Firestore if it exists
  console.log('Updating seed customer account user name...');
  try {
    await setDoc(doc(db, 'users', 'mock_uid_customer'), {
      firebaseId: 'mock_uid_customer',
      email: 'customer@smartcart.com',
      name: 'Mr.B Smart Customer',
      role: 'customer',
      budgetLimit: 2000,
      budgetHistory: [{ date: new Date().toISOString(), limit: 2000 }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('Seed customer name updated successfully.');
  } catch (err: any) {
    console.error('Failed to update seed customer name:', err.message);
  }

  console.log('Products update complete!');
  process.exit(0);
};

updateProducts();
