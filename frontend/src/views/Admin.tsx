import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Settings, Edit2, Trash2, Sparkles, CheckCircle2, 
  RotateCcw, FileText, UploadCloud, Search, 
  Users, Receipt, Radio, Server, LayoutDashboard,
  ShieldCheck, Barcode, TrendingUp, ShoppingBag, Clock, Cpu
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getProductImage = (category: string): string => {
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

const Admin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { triggerLocalNotification } = useSocket();

  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [rfidScans, setRfidScans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [rfidUid, setRfidUid] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [category, setCategory] = useState('Dairy');
  const [image, setImage] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');

  // CSV State
  const [csvText, setCsvText] = useState('');
  const [showCsvBox, setShowCsvBox] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resTx, resUsers, resScans, resSessions] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/transactions`),
        axios.get(`${API_URL}/users`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/rfid/history`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/shopping-sessions`).catch(() => ({ data: [] }))
      ]);
      
      setProducts(resProd.data);
      setTransactions(resTx.data);
      setUsers(resUsers.data);
      setRfidScans(resScans.data);
      setSessions(resSessions.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPath]);

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { storage } = await import('../firebase');
      if (!storage) {
        throw new Error('Firebase Storage is not initialized.');
      }
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      const fileRef = ref(storage, `products/${rfidUid || 'unnamed'}_${Date.now()}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setImage(url);
      triggerLocalNotification('success', 'Image Uploaded', 'Product image saved to Firebase Storage.');
    } catch (err: any) {
      triggerLocalNotification('error', 'Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const prodData = {
      uid: rfidUid.trim(),
      name: productName.trim(),
      price: Number(price),
      weight: Number(weight),
      stock: Number(stockQuantity),
      category,
      imageUrl: image,
    };

    try {
      if (editId) {
        await axios.put(`${API_URL}/products/${editId}`, prodData);
        triggerLocalNotification('success', 'Catalog Modified', `Product "${productName}" updated.`);
      } else {
        await axios.post(`${API_URL}/products`, prodData);
        triggerLocalNotification('success', 'Catalog Modified', `Product "${productName}" registered.`);
      }
      handleReset();
      await fetchData();
    } catch (err: any) {
      triggerLocalNotification('error', 'Update Failed', err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (p: any) => {
    setEditId(p._id);
    setRfidUid(p.uid);
    setProductName(p.name);
    setPrice(p.price.toString());
    setWeight(p.weight.toString());
    setCategory(p.category);
    setStockQuantity(p.stock !== undefined ? p.stock.toString() : '100');
    setImage(p.imageUrl || '');
    // Switch to products page if not there
    if (currentPath !== '/admin/products') {
      navigate('/admin/products');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product from inventory database?')) return;
    try {
      await axios.delete(`${API_URL}/products/${id}`);
      triggerLocalNotification('warning', 'Product Deleted', 'Item removed from database.');
      await fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) {
      triggerLocalNotification('error', 'Import Error', 'CSV content is empty.');
      return;
    }

    try {
      const lines = csvText.split('\n');
      const jsonProducts: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(',');
        if (cols.length >= 3) {
          jsonProducts.push({
            uid: cols[0]?.trim(),
            name: cols[1]?.trim(),
            price: Number(cols[2]?.trim()) || 100,
            weight: Number(cols[3]?.trim()) || 500,
            stock: Number(cols[4]?.trim()) || 100,
            category: cols[5]?.trim() || 'General',
          });
        }
      }

      const response = await axios.post(`${API_URL}/products/bulk`, { products: jsonProducts });
      if (response.data.success) {
        triggerLocalNotification('success', 'Import Success', `Successfully imported ${response.data.count} items.`);
        setCsvText('');
        setShowCsvBox(false);
        await fetchData();
      }
    } catch (err: any) {
      triggerLocalNotification('error', 'Import Failed', err.response?.data?.error || err.message);
    }
  };

  const handleReset = () => {
    setEditId(null);
    setRfidUid('');
    setProductName('');
    setPrice('');
    setWeight('');
    setExpiryDate('2026-12-31');
    setCategory('Dairy');
    setImage('');
    setStockQuantity('100');
  };

  const generateMockRfid = () => {
    const code = Math.floor(100 + Math.random() * 900);
    setRfidUid(`RFID_CARD_${code}`);
  };

  // Filter products for CRUD tab
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats
  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.totalPaid, 0);

  return (
    <div className="space-y-6 text-theme-text transition-colors duration-300">
      
      {/* PAGE 1: OVERVIEW DASHBOARD */}
      {currentPath === '/admin' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <LayoutDashboard className="text-emerald-500" /> Admin Dashboard Overview
              </h2>
              <p className="text-xs text-slate-400">Key metrics summary for supermarket kiosk systems.</p>
            </div>
            <button 
              onClick={fetchData} 
              className="glass-button-secondary text-xs px-3.5 py-1.5"
            >
              Refresh Data
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500 bg-theme-card border-theme-border">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Revenue</span>
                <h3 className="text-xl font-extrabold text-theme-text">Rs. {totalRevenue.toLocaleString()}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500/20" />
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-violet-500 bg-theme-card border-theme-border">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Processed Orders</span>
                <h3 className="text-xl font-extrabold text-theme-text">{transactions.length}</h3>
              </div>
              <Receipt className="w-8 h-8 text-violet-500/20" />
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-teal-500 bg-theme-card border-theme-border">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Catalog Products</span>
                <h3 className="text-xl font-extrabold text-theme-text">{products.length}</h3>
              </div>
              <ShoppingBag className="w-8 h-8 text-teal-500/20" />
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-amber-500 bg-theme-card border-theme-border">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registered Users</span>
                <h3 className="text-xl font-extrabold text-theme-text">{users.length || 2}</h3>
              </div>
              <Users className="w-8 h-8 text-amber-500/20" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent orders */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl bg-theme-card border-theme-border text-left space-y-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" /> Recent Supermarket Orders
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-theme-border text-slate-400 font-bold pb-2 uppercase tracking-wide">
                      <th className="pb-2">Order / Trans. ID</th>
                      <th className="pb-2">Customer</th>
                      <th className="pb-2 text-right">Items Count</th>
                      <th className="pb-2 text-right">Total Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/20">
                    {transactions.slice(0, 5).map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-100/10">
                        <td className="py-2.5 font-bold text-theme-text">
                          <div>{tx.orderNumber || tx.transactionId}</div>
                          <div className="text-[9px] text-slate-400 font-mono font-medium">{tx.transactionId}</div>
                        </td>
                        <td className="py-2.5 text-slate-450">{tx.customerName}</td>
                        <td className="py-2.5 text-right font-bold text-slate-500">{tx.items?.length || 0} items</td>
                        <td className="py-2.5 text-right font-extrabold text-emerald-500">Rs. {tx.totalPaid.toLocaleString()}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">No transactions recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick telemetry stats */}
            <div className="glass-panel p-6 rounded-3xl bg-theme-card border-theme-border text-left space-y-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-500 animate-pulse" /> Kiosk Hardware Status
              </h3>
              <div className="space-y-4 text-xs font-semibold text-slate-500">
                <div className="flex justify-between items-center py-1.5 border-b border-theme-border/20">
                  <span>ESP32 State:</span>
                  <span className="badge-success">Connected</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-theme-border/20">
                  <span>RFID Scans Count:</span>
                  <span className="text-theme-text font-bold">{rfidScans.length}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-theme-border/20">
                  <span>Last Scanned UID:</span>
                  <span className="font-mono text-emerald-500 font-bold">{rfidScans[0]?.uid || 'RFID001'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span>Connection RSSI:</span>
                  <span className="text-emerald-500 font-bold">-65 dBm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: PRODUCT CATALOG MANAGEMENT */}
      {currentPath === '/admin/products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Settings className="text-emerald-500" /> Inventory Catalog Manager
              </h2>
              <p className="text-xs text-slate-400">Perform CRUD edits or import grocery CSV products.</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowCsvBox(!showCsvBox)}
                className="glass-button-secondary text-xs font-bold"
              >
                <FileText className="w-4 h-4 text-emerald-500" /> Bulk Import
              </button>
            </div>
          </div>

          {showCsvBox && (
            <div className="glass-panel rounded-3xl p-6 space-y-4 text-left bg-theme-card border-theme-border">
              <div>
                <h4 className="font-extrabold text-sm text-theme-text">CSV Product Bulk Import</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Format: uid, name, price, weight, stock, category
                </p>
              </div>

              <textarea
                rows={5}
                placeholder={`uid,name,price,weight,stock,category\nRFID004,Tomato Soup,120,300,100,Canned`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-theme-bg border border-theme-border font-mono text-[11px] text-theme-text focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCsvBox(false)}
                  className="px-4 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-md"
                >
                  <UploadCloud className="w-4 h-4" /> Import Records
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Product Table */}
            <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-theme-card border-theme-border text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <h4 className="font-extrabold text-theme-text flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-emerald-500" /> Database Catalog Registry
                </h4>
                
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name/RFID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-theme-bg border border-theme-border text-[11px] text-theme-text focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-theme-border text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Product Name</th>
                      <th className="pb-3">RFID UID</th>
                      <th className="pb-3 text-center">Weight</th>
                      <th className="pb-3 text-right">Price</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/20">
                    {filteredProducts.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-100/10">
                        <td className="py-3 flex items-center gap-3">
                          <img 
                            src={p.imageUrl || getProductImage(p.category)} 
                            alt={p.name} 
                            className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-theme-border"
                          />
                          <div>
                            <span className="font-bold text-theme-text">{p.name}</span>
                            <span className="block text-[9px] text-slate-400 font-medium uppercase mt-0.5">{p.category}</span>
                          </div>
                        </td>
                        <td className="py-3 font-mono font-semibold text-emerald-500">{p.uid}</td>
                        <td className="py-3 text-center font-bold text-slate-500">{p.weight}g</td>
                        <td className="py-3 text-right font-extrabold text-theme-text">Rs. {p.price}</td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded-lg border border-theme-border text-slate-400 hover:text-emerald-500"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="p-1.5 rounded-lg border border-theme-border text-slate-400 hover:text-rose-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-450 font-medium">No matching items found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Form Editor */}
            <div className="glass-panel rounded-3xl p-6 text-left bg-theme-card border-theme-border space-y-4">
              <div>
                <h4 className="font-extrabold text-theme-text flex items-center gap-1.5">
                  <Sparkles className="text-emerald-500" /> {editId ? 'Modify Product' : 'Register Product'}
                </h4>
                <p className="text-[10px] text-slate-400">Save catalog details and RFID bindings.</p>
              </div>

              <form onSubmit={handleSave} className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Premium Milk"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="glass-input text-xs py-2 px-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Price (Rs.)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="450"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="glass-input text-xs py-2 px-3"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Weight (g)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="1000"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="glass-input text-xs py-2 px-3"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">RFID Tag UID</label>
                    <button
                      type="button"
                      onClick={generateMockRfid}
                      className="text-[9px] font-bold text-emerald-500 hover:underline"
                    >
                      Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RFID001"
                    value={rfidUid}
                    onChange={(e) => setRfidUid(e.target.value)}
                    className="glass-input text-xs font-mono py-2 px-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wide">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="glass-input text-xs py-2 px-3 h-[38px] bg-theme-card"
                    >
                      <option value="Rice">Rice</option>
                      <option value="Milk Powder">Milk Powder</option>
                      <option value="Soap">Soap</option>
                      <option value="Toothpaste">Toothpaste</option>
                      <option value="Biscuits">Biscuits</option>
                      <option value="Tea">Tea</option>
                      <option value="Coffee">Coffee</option>
                      <option value="Margarine">Margarine</option>
                      <option value="Sauce">Sauce</option>
                      <option value="Instant Food">Instant Food</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Chocolate">Chocolate</option>
                      <option value="Ice Cream">Ice Cream</option>
                      <option value="Detergent">Detergent</option>
                      <option value="Snacks">Snacks</option>
                      <option value="Personal Care">Personal Care</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-slate-400 tracking-wide">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="100"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="glass-input text-xs py-2 px-3"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wide uppercase">Product Image</label>
                  {image && (
                    <img 
                      src={image} 
                      alt="Product preview" 
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-theme-border mb-2"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20"
                    />
                    {uploading && <span className="text-[10px] text-slate-450 animate-pulse">Uploading...</span>}
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter image URL manually..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="glass-input text-xs py-1.5 px-3 mt-2"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editId && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="flex-1 glass-button-secondary text-xs flex items-center justify-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 glass-button text-xs font-bold flex items-center justify-center gap-1 shadow-md bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 3: USER MANAGEMENT */}
      {currentPath === '/admin/users' && (
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Users className="text-emerald-500" /> User Accounts Directory
            </h2>
            <p className="text-xs text-slate-400">View and audit registered customer and manager profiles.</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-border text-slate-400 font-bold pb-2 uppercase tracking-wide">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">System Role</th>
                    <th className="pb-3 font-mono">Firebase ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {users.length === 0 ? (
                    // Hardcoded fallback list if MongoDB seed fails or users list is empty
                    <>
                      <tr className="hover:bg-slate-100/10">
                        <td className="py-3 font-bold text-theme-text">Smart Admin</td>
                        <td className="py-3 text-slate-500">admin@smartcart.com</td>
                        <td className="py-3"><span className="badge-warning text-[9px]">admin</span></td>
                        <td className="py-3 font-mono text-slate-400">mock_uid_admin</td>
                      </tr>
                      <tr className="hover:bg-slate-100/10">
                        <td className="py-3 font-bold text-theme-text">Smart Customer</td>
                        <td className="py-3 text-slate-500">customer@smartcart.com</td>
                        <td className="py-3"><span className="badge-success text-[9px]">customer</span></td>
                        <td className="py-3 font-mono text-slate-400">mock_uid_customer</td>
                      </tr>
                    </>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-100/10">
                        <td className="py-3 font-bold text-theme-text">{u.name}</td>
                        <td className="py-3 text-slate-550">{u.email}</td>
                        <td className="py-3">
                          <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            u.role === 'admin' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {u.role || 'customer'}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-450">{u.firebaseId}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 4: TRANSACTIONS LIST */}
      {currentPath === '/admin/transactions' && (
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Receipt className="text-emerald-500" /> Supermarket POS Checkout Logs
            </h2>
            <p className="text-xs text-slate-400">Comprehensive list of orders processed through the smart kiosks.</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-border text-slate-400 font-bold pb-2 uppercase tracking-wide">
                    <th className="pb-3">Order / Trans. ID</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Contacts</th>
                    <th className="pb-3">Purchased Items</th>
                    <th className="pb-3 text-right">Total Paid</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-100/10">
                      <td className="py-3.5 font-bold text-theme-text text-left">
                        <div>{tx.orderNumber || tx.transactionId}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">{tx.transactionId}</div>
                        {tx.paymentMethod && (
                          <span className="inline-block mt-1 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {tx.paymentMethod}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">{tx.customerName}</td>
                      <td className="py-3.5 text-slate-450 leading-relaxed">
                        {tx.email}<br/>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{tx.phone}</span>
                      </td>
                      <td className="py-3.5 text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium max-w-[200px] truncate">
                        {tx.items?.map((item: any) => `${item.productName} (x${item.quantity})`).join(', ')}
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-emerald-500">Rs. {tx.totalPaid.toLocaleString()}</td>
                      <td className="py-3.5 text-center">
                        <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                          tx.paymentStatus === 'Failed' 
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {tx.paymentStatus || 'Success'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-slate-400 font-semibold font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()}<br/>
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">No checkout transactions logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 5: RFID MANAGEMENT & HISTORY LOGS */}
      {currentPath === '/admin/rfid' && (
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Radio className="text-emerald-500" /> RFID Scanning Operations
            </h2>
            <p className="text-xs text-slate-400">Monitor live incoming RFID scan signals from hardware antennas or simulators.</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border">
            <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-4">Chronology of RFID Tag Events</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-border text-slate-400 font-bold pb-2 uppercase tracking-wide">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3 font-mono">RFID Tag UID</th>
                    <th className="pb-3">Identified Product</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {rfidScans.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-100/10">
                      <td className="py-3 text-slate-450 font-mono font-medium">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 font-mono font-semibold text-emerald-500">{log.uid}</td>
                      <td className="py-3 font-bold text-theme-text">
                        {log.success ? log.productName : <span className="text-rose-500">Unrecognized Product</span>}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                          log.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {log.success ? 'Success' : 'Invalid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {rfidScans.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">No scans recorded yet. Verify connection pings.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 6: DATABASE MANAGEMENT */}
      {currentPath === '/admin/db' && (
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Server className="text-emerald-500" /> Database Registry Console
            </h2>
            <p className="text-xs text-slate-400">View live engine mappings, seed tables, or adjust offline configurations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl bg-theme-card border-theme-border space-y-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Connection Parameters
              </h3>
              
              <div className="space-y-3.5 text-xs font-semibold text-slate-500">
                <div className="flex justify-between items-center pb-2 border-b border-theme-border/20">
                  <span>Engine Connection:</span>
                  <span className="text-theme-text font-bold">MongoDB Atlas</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-theme-border/20">
                  <span>Server URL Address:</span>
                  <span className="font-mono text-emerald-500 font-bold">{API_URL}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-theme-border/20">
                  <span>In-Memory Fallback State:</span>
                  <span className="badge-warning text-[9px]">Disabled</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Database Seeding Status:</span>
                  <span className="text-theme-text font-bold">MILK, BREAD, RICE Pre-seeded</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl bg-theme-card border-theme-border space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2 mb-2">
                  <RotateCcw className="w-4 h-4 text-emerald-500 animate-spin-slow" /> Database Maintenance
                </h3>
                <p className="text-xs text-slate-450 leading-relaxed font-medium">
                  Trigger automatic collection seeds to restore predefined items (MILK, BREAD, RICE UIDs) or wipe temporary demo transactions history.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await fetchData();
                    triggerLocalNotification('success', 'Database Status', 'Database tables refreshed.');
                  }}
                  className="glass-button text-xs font-bold"
                >
                  Sync Collections
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 7: SHOPPING SESSIONS LOG */}
      {currentPath === '/admin/sessions' && (
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Clock className="text-emerald-500" /> Kiosk Shopping Sessions Log
            </h2>
            <p className="text-xs text-slate-400">Live and completed shopper kiosk session tracking from MongoDB.</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 bg-theme-card border-theme-border">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-border text-slate-400 font-bold pb-2 uppercase tracking-wide">
                    <th className="pb-3">Session / Cart ID</th>
                    <th className="pb-3">Items list</th>
                    <th className="pb-3 text-right">Budget Limit</th>
                    <th className="pb-3 text-right">Total Bill</th>
                    <th className="pb-3 text-center">Expected Weight</th>
                    <th className="pb-3 text-center">Physical Weight</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/20">
                  {sessions.map((sess) => (
                    <tr key={sess._id} className="hover:bg-slate-100/10">
                      <td className="py-3.5 font-bold text-theme-text font-mono">{sess.cartId}</td>
                      <td className="py-3.5 text-slate-500 font-medium leading-normal max-w-[220px] truncate">
                        {sess.items && sess.items.length > 0 
                          ? sess.items.map((it: any) => `${it.product?.name || 'Product'} (x${it.quantity})`).join(', ') 
                          : <span className="italic text-slate-400">Empty Cart</span>
                        }
                      </td>
                      <td className="py-3.5 text-right font-semibold text-slate-500">Rs. {sess.budget?.toLocaleString() || 0}</td>
                      <td className="py-3.5 text-right font-extrabold text-theme-text">Rs. {sess.totalAmount?.toLocaleString() || 0}</td>
                      <td className="py-3.5 text-center font-semibold text-slate-550">{sess.expectedWeight || 0}g</td>
                      <td className="py-3.5 text-center font-bold">
                        <span className={sess.weightMismatch ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-500'}>
                          {sess.physicalWeight || 0}g
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                          sess.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                            : sess.status === 'stopped'
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                              : 'bg-blue-500/15 text-blue-500 border border-blue-500/20'
                        }`}>
                          {sess.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-slate-400 font-semibold font-mono">
                        {new Date(sess.updatedAt).toLocaleDateString()}<br/>
                        {new Date(sess.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {sessions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">No shopping sessions active or completed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;
