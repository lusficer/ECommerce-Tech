'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Store, Package, TrendingUp, Plus, Settings, ShieldCheck, 
  Loader2, Search, CheckCircle2, Percent, Edit, Trash2, X,
  Truck, ClipboardList, ShoppingBag, AlertTriangle, Eye, Info, BarChart3
} from 'lucide-react';

export default function SellerDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'VENDOR' | 'MANAGER' | 'SHIPPER' | null>(null);
  const [userId, setUserId] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasShop, setHasShop] = useState(false);
  const [shopData, setShopData] = useState({ shopId: '', shopName: '', address: '', description: '', logoUrl: '', status: '' });
  const [saving, setSaving] = useState(false);

  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); 
  const [productForm, setProductForm] = useState({ 
    targetShopId: '', 
    name: '', 
    categoryId: 'CAT_PHONE', 
    price: 0, 
    discountPercentage: 0, 
    stockQuantity: 0, 
    imageUrl: '', 
    description: '',
    brand: '',              
    specifications: ''      
  });

  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState<any[]>([]);
  const [isSearchingShop, setIsSearchingShop] = useState(false);

  const [discountModal, setDiscountModal] = useState({ isOpen: false, productId: '', productName: '', discount: 0 });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, productId: '', productName: '', reason: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, productId: '' });
  const [detailModal, setDetailModal] = useState({ isOpen: false, product: null as any });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUserId = localStorage.getItem('userId');

    if (!token || !storedUserId) {
      toast.error('Please log in!');
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    
    if (storedUserId.startsWith('SHOP_MNG')) {
      setRole('MANAGER');
      fetchShopData(storedUserId, token, 'MANAGER');
    } else if (storedUserId.startsWith('VEND')) {
      setRole('VENDOR');
      fetchVendorProducts('SHOP_001', token); 
      setLoading(false);
    } else if (storedUserId.startsWith('SHIPPER')) {
      setRole('SHIPPER');
      setLoading(false); 
    } else {
      toast.error('Access Denied. This dashboard is for internal staff only.');
      router.push('/'); 
      return;
    }
  }, [router]);

  const fetchShopData = async (ownerId: string, token: string, currentRole: string) => {
    try {
      const res = await fetch(`http://localhost:8082/api/shops/owner/${ownerId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const shops = await res.json();
        if (shops && shops.length > 0) {
          setHasShop(true);
          setShopData(shops[0]);
          if(currentRole === 'MANAGER') {
            fetchApprovalQueue(token, shops[0].shopId);
            fetchManagerProducts(shops[0].shopId, token); 
          }
        }
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchApprovalQueue = async (token: string, currentShopId: string) => {
    try {
      const res = await fetch(`http://localhost:8083/api/manager/products/queue`, { headers: { 'Authorization': `Bearer ${token}`, 'SHOP-ID': currentShopId } });
      if (res.ok) setApprovalQueue(await res.json());
    } catch (error) {}
  };

  const fetchManagerProducts = async (shopId: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:8083/api/manager/products`, { headers: { 'Authorization': `Bearer ${token}`, 'SHOP-ID': shopId } });
      if (res.ok) setMyProducts(await res.json());
    } catch (error) {}
  };

  const fetchVendorProducts = async (shopId: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:8083/api/vendor/products`, { headers: { 'Authorization': `Bearer ${token}`, 'X-Shop-Id': shopId } });
      if (res.ok) setMyProducts(await res.json());
    } catch (error) {}
  };

  const searchShops = async (keyword: string) => {
    setShopSearchQuery(keyword);
    if (!keyword.trim()) { setShopSearchResults([]); return; }
    
    setIsSearchingShop(true);
    const token = localStorage.getItem('accessToken'); 

    try {
      const res = await fetch(`http://localhost:8082/api/shops/search?keyword=${encodeURIComponent(keyword)}`, { headers: { 'Authorization': `Bearer ${token}` } }); 
      if (res.ok) {
        const data = await res.json();
        setShopSearchResults(data);
      }
    } catch (error) { console.error(error); } finally { setIsSearchingShop(false); }
  };

  const handleApproveProduct = async (product: any) => {
    setSaving(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:8083/api/manager/products/${product.productId}/review`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          managerId: userId, 
          approved: true, 
          comments: "Approved", 
          discountPercentage: product.discountPercentage || 0 
        })
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success('Product Approved successfully!');
      fetchApprovalQueue(token!, shopData.shopId); 
      fetchManagerProducts(shopData.shopId, token!);
      setDetailModal({ isOpen: false, product: null });
    } catch (error: any) { 
      toast.error(error.message); 
    } finally {
      setSaving(false);
    }
  };

  const handleSaveReject = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setSaving(true);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:8083/api/manager/products/${rejectModal.productId}/review`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId: userId, approved: false, comments: rejectModal.reason, discountPercentage: 0 })
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success('Product Rejected!');
      fetchApprovalQueue(token!, shopData.shopId); 
      fetchManagerProducts(shopData.shopId, token!);
      setRejectModal({ ...rejectModal, isOpen: false, reason: '' });
    } catch (error: any) { 
      toast.error(error.message); 
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDiscount = async () => {
    setSaving(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await fetch(
        `http://localhost:8083/api/manager/products/${discountModal.productId}/discount?percentage=${discountModal.discount}&managerId=${userId}`, 
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'SHOP-ID': shopData.shopId }
        }
      );
      
      if (!res.ok) throw new Error('Failed to update discount');
      
      toast.success('Discount updated successfully!');
      fetchManagerProducts(shopData.shopId, token!);
      fetchApprovalQueue(token!, shopData.shopId);
      setDiscountModal({ ...discountModal, isOpen: false });
    } catch (error: any) { 
      toast.error(error.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('accessToken');
    const finalShopId = role === 'MANAGER' ? shopData.shopId : productForm.targetShopId;

    if (!finalShopId) { toast.error('Please select a partner shop!'); setSaving(false); return; }

    const url = editingId 
      ? `http://localhost:8083/api/${role?.toLowerCase()}/products/${editingId}` 
      : `http://localhost:8083/api/vendor/products`; 
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
         method: method,
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'SHOP-ID': finalShopId },
         body: JSON.stringify({...productForm, shopId: finalShopId})
      });
      if(!res.ok) throw new Error('Failed to save product!');
      
      toast.success(editingId ? 'Product updated successfully!' : 'Product submitted successfully!');
      setShowProductForm(false);
      if(role === 'MANAGER') fetchManagerProducts(shopData.shopId, token!);
      else fetchVendorProducts(finalShopId, token!);
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const executeDeleteProduct = async () => {
    setSaving(true);
    const { productId } = deleteModal;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:8083/api/${role?.toLowerCase()}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted successfully!');
      if(role === 'MANAGER') fetchManagerProducts(shopData.shopId, token!);
      else fetchVendorProducts(productForm.targetShopId || 'SHOP_001', token!);
      setDeleteModal({ isOpen: false, productId: '' });
    } catch (error: any) { 
      toast.error(error.message); 
    } finally {
      setSaving(false);
    }
  };

  const openEditForm = (product: any) => {
    setEditingId(product.productId);
    setProductForm({
      targetShopId: product.shopId,
      name: product.name,
      categoryId: product.categoryId || 'CAT_PHONE',
      price: product.price,
      discountPercentage: product.discountPercentage || 0,
      stockQuantity: product.stockQuantity || 0,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      brand: product.brand || '',                   
      specifications: product.specifications || ''  
    });
    setShopSearchQuery(product.shopId); 
    setShowProductForm(true);
  };

  const openAddForm = () => {
    setEditingId(null);
    setProductForm({ targetShopId: '', name: '', categoryId: 'CAT_PHONE', price: 0, discountPercentage: 0, stockQuantity: 0, description: '', imageUrl: '', brand: '', specifications: '' });
    setShopSearchQuery('');
    setShowProductForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductForm({ ...productForm, imageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-cyan-600" /></div>;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 font-sans relative">
      <div className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600">Home</Link> <span className="mx-2">/</span> <span className="text-slate-900">Internal Portal</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        <div className="w-full lg:w-1/4 flex flex-col gap-4 sticky top-28">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-500">
               {role === 'SHIPPER' ? <Truck className="w-32 h-32 -mr-10 -mt-10" /> : <Store className="w-32 h-32 -mr-10 -mt-10" />}
             </div>
             <div className="relative z-10">
               <h2 className="text-2xl font-black mb-1 leading-tight">
                 {role === 'MANAGER' ? (shopData.shopName || 'Shop Manager') : 
                  role === 'SHIPPER' ? 'Delivery Center' : 'Vendor Portal'}
               </h2>
               <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mt-2">{role}</p>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col gap-1">
            <button onClick={() => {setActiveTab('dashboard'); setShowProductForm(false)}} className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <TrendingUp className="w-5 h-5" /> Overview
            </button>

            {role !== 'SHIPPER' && (
              <Link 
                href="/seller/analytics" 
                className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all"
              >
                <BarChart3 className="w-5 h-5" /> Analytics & Reports
              </Link>
            )}
            
            {role !== 'SHIPPER' && (
              <>
                <button onClick={() => {setActiveTab('products'); setShowProductForm(false)}} className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'products' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-3"><Package className="w-5 h-5" /> {role === 'MANAGER' ? 'Shop Inventory' : 'My Products'}</div>
                  <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-xs">{myProducts.length}</span>
                </button>
                {role === 'MANAGER' && (
                  <>
                    <button onClick={() => {setActiveTab('approval'); setShowProductForm(false)}} className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'approval' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5" /> Approval Queue</div>
                      {approvalQueue.length > 0 && <span className="bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs animate-pulse">{approvalQueue.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <Settings className="w-5 h-5" /> Shop Settings
                    </button>
                  </>
                )}
              </>
            )}

            

            <div className="h-px bg-slate-100 my-2"></div>
            <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order & Shipping</div>

            {role === 'VENDOR' && (
              <Link href="/seller/orders" className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all">
                <ShoppingBag className="w-5 h-5" /> Order Management
              </Link>
            )}

            {role === 'MANAGER' && (
              <Link href="/manager/orders" className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all">
                <ClipboardList className="w-5 h-5" /> Order Verification
              </Link>
            )}

            {role === 'SHIPPER' && (
              <Link href="/shipper/orders" className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all">
                <Truck className="w-5 h-5" /> Delivery Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="w-full lg:w-3/4">
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {activeTab === 'dashboard' && (
               <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Welcome back, {userId}!</h3>
                  <p className="text-slate-500 mb-8">
                    {role === 'SHIPPER' ? "Get ready for your delivery routes today." : "Manage your operations effectively from this portal."}
                  </p>
                  {role === 'VENDOR' && (
                    <Link href="/seller/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors">
                      <ShoppingBag className="w-5 h-5" /> Go to Order Management
                    </Link>
                  )}
                  {role === 'MANAGER' && (
                    <Link href="/manager/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                      <ClipboardList className="w-5 h-5" /> Review Pending Orders
                    </Link>
                  )}

                  {role !== 'SHIPPER' && (
                  <Link href="/seller/analytics" className="inline-flex items-center ml-2 gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                    <BarChart3 className="w-5 h-5" /> View Sales Analytics
                  </Link>
                )}
                  {role === 'SHIPPER' && (
                    <Link href="/shipper/orders" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-md">
                      <Truck className="w-5 h-5" /> Open Delivery Dashboard
                    </Link>
                  )}
               </div>
            )}

            {activeTab === 'products' && role !== 'SHIPPER' && (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[600px]">
                {!showProductForm ? (
                  <div className="animate-in fade-in">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900">{role === 'MANAGER' ? 'Shop Inventory' : 'My Product Listings'}</h3>
                      
                      {role === 'VENDOR' && (
                        <button onClick={openAddForm} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
                          <Plus className="w-4 h-4" /> ADD PRODUCT
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto custom-scrollbar pb-4">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-sm font-bold text-slate-400">
                            <th className="pb-3 px-4 w-1/3">Product</th>
                            <th className="pb-3 px-4 whitespace-nowrap">Price</th>
                            <th className="pb-3 px-4 whitespace-nowrap">Stock</th>
                            <th className="pb-3 px-4 whitespace-nowrap">Discount</th>
                            <th className="pb-3 px-4 whitespace-nowrap">Status</th>
                            <th className="pb-3 px-2 text-right whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-slate-700">
                          {myProducts.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-10 text-slate-400">No products found.</td>
                            </tr>
                          )}
                          {myProducts.map((p) => (
                            <tr key={p.productId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                  {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover"/>
                                  ) : (
                                    <Package className="w-5 h-5 m-2.5 text-slate-400"/>
                                  )}
                                </div>
                                <span className="font-bold line-clamp-2 text-slate-800">{p.name}</span>
                              </td>
                              
                              <td className="py-4 px-4 font-black text-cyan-600">
                                ${p.price}
                              </td>
                              
                              <td className="py-4 px-4 font-bold text-slate-700 whitespace-nowrap">
                                {p.stockQuantity || 0} <span className="text-xs font-medium text-slate-400 ml-0.5">units</span>
                              </td>
                              
                              <td className="py-4 px-4 font-bold text-slate-500 whitespace-nowrap">
                                {p.discountPercentage > 0 ? (
                                  <span className="text-green-700 bg-green-100 border border-green-200 px-2 py-1 rounded-md text-xs">
                                    {p.discountPercentage}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400">0%</span>
                                )}
                              </td>
                              
                              <td className="py-4 px-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  p.approvalStatus === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-200' : 
                                  p.approvalStatus === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                                }`}>
                                  {p.approvalStatus}
                                </span>
                              </td>
                              
                              <td className="py-4 px-2 text-right">
                                <div className="flex justify-end gap-1.5 items-center">
                                  {role === 'MANAGER' && p.approvalStatus === 'APPROVED' && (
                                    <button 
                                      onClick={() => setDiscountModal({ isOpen: true, productId: p.productId, productName: p.name, discount: p.discountPercentage || 0 })} 
                                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Set Discount">
                                      <Percent className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button onClick={() => openEditForm(p)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="Edit">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setDeleteModal({ isOpen: true, productId: p.productId })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in slide-in-from-right-8 duration-300">
                    <button onClick={() => setShowProductForm(false)} className="text-sm font-bold text-slate-500 hover:text-cyan-600 mb-6 flex items-center gap-1">
                      ← Back to Products
                    </button>
                    <h3 className="text-xl font-black text-slate-900 mb-6">
                      {editingId ? 'Edit Product' : 'Create New Listing'}
                    </h3>
                    
                    <form className="space-y-6" onSubmit={handleProductSubmit}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {role === 'VENDOR' && (
                           <div className="md:col-span-2 bg-blue-50 p-5 rounded-2xl border border-blue-100 relative">
                             <label className="block text-sm font-black text-blue-900 mb-2">Search Partner Shop <span className="text-red-500">*</span></label>
                             <div className="relative">
                               <Search className="absolute left-4 top-3.5 w-5 h-5 text-blue-400" />
                               <input type="text" value={shopSearchQuery} onChange={(e) => searchShops(e.target.value)} placeholder="Type shop name..." className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white text-sm font-medium transition-all" />
                               {isSearchingShop && <Loader2 className="absolute right-4 top-3.5 w-5 h-5 animate-spin text-blue-500" />}
                             </div>
                             {shopSearchResults.length > 0 && (
                                <ul className="absolute z-20 left-5 right-5 mt-2 bg-white border border-blue-100 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                  {shopSearchResults.map(shop => (
                                      <li key={shop.shopId} onClick={() => { setProductForm({...productForm, targetShopId: shop.shopId}); setShopSearchQuery(shop.shopName); setShopSearchResults([]); }} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 transition-colors">
                                         <div className="font-bold text-sm text-slate-800">{shop.shopName}</div>
                                         <div className="text-xs text-slate-400 mt-0.5">ID: {shop.shopId}</div>
                                      </li>
                                  ))}
                                </ul>
                             )}
                             {productForm.targetShopId && <div className="mt-3 text-xs font-bold text-green-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Selected: {productForm.targetShopId}</div>}
                           </div>
                         )}

                         <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Product Name <span className="text-red-500">*</span></label>
                           <input type="text" required value={productForm.name} onChange={(e)=>setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
                         </div>
                         
                         <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Regular Price ($) <span className="text-red-500">*</span></label>
                            <input type="number" step="0.01" required value={productForm.price} onChange={(e)=>setProductForm({...productForm, price: parseFloat(e.target.value)})} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Stock Quantity <span className="text-red-500">*</span></label>
                            <input type="number" min="0" required value={productForm.stockQuantity} onChange={(e)=>setProductForm({...productForm, stockQuantity: parseInt(e.target.value) || 0})} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
                          </div>
                        </div>

                         <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">Category <span className="text-red-500">*</span></label>
                             <select value={productForm.categoryId} onChange={(e)=>setProductForm({...productForm, categoryId: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm cursor-pointer">
                               <option value="CAT_PHONE">Smartphones</option>
                               <option value="CAT_LAPTOP">Laptops & PCs</option>
                               <option value="CAT_TABLET">Tablets</option>
                               <option value="CAT_ACCESSORY">Accessories</option>
                               <option value="CAT_AUDIO">Audio</option>
                               <option value="CAT_GAMING">Gaming Console</option>
                               <option value="CAT_MONITOR">Monitors</option>
                               <option value="CAT_ELEC">Electronics</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">Brand <span className="text-red-500">*</span></label>
                             <input type="text" required placeholder="e.g. Apple, Samsung..." value={productForm.brand} onChange={(e)=>setProductForm({...productForm, brand: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
                           </div>
                         </div>
                       </div>
                       
                       <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Product Image</label>
                         <input type="file" onChange={handleImageChange} accept="image/*" className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 mb-3" />
                         <input type="text" placeholder="Or paste an image URL here..." value={productForm.imageUrl} onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm text-slate-500" />
                       </div>

                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Specifications / Attributes</label>
                          <textarea placeholder='e.g. {"Color": "Space Gray", "Storage": "256GB"}' value={productForm.specifications} onChange={(e)=>setProductForm({...productForm, specifications: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm font-mono text-slate-700 min-h-[120px]" />
                       </div>
                       
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                          <textarea placeholder="Detail description of your product..." value={productForm.description} onChange={(e)=>setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm text-slate-700 min-h-[160px]" />
                       </div>

                       <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
                         <button type="submit" disabled={saving} className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
                            {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                            {saving ? 'SAVING...' : (editingId ? 'UPDATE PRODUCT' : 'SUBMIT PRODUCT')}
                         </button>
                       </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approval' && role === 'MANAGER' && (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[600px] animate-in fade-in">
                <h3 className="text-xl font-black text-slate-900 mb-2">Pending Approvals</h3>
                <p className="text-sm text-slate-500 mb-8">Review product submissions from vendors.</p>
                {approvalQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                     <ShieldCheck className="w-16 h-16 mb-4 opacity-50 text-green-500" />
                     <p className="font-bold text-lg text-slate-500">All caught up!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-sm font-bold text-slate-400">
                          <th className="pb-3">Product Info</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm font-medium text-slate-700">
                        {approvalQueue.map((item) => (
                          <tr key={item.productId} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="py-4 flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover"/> : <Package className="w-6 h-6 m-3 text-slate-400"/>}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 line-clamp-1">{item.name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Vendor Request</p>
                              </div>
                            </td>
                            <td className="py-4 font-bold text-cyan-600">${item.price}</td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2 items-center">
                                <button 
                                  onClick={() => setDetailModal({ isOpen: true, product: item })} 
                                  className="px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors font-bold text-xs flex items-center gap-1.5 shadow-sm"
                                >
                                  <Eye className="w-3.5 h-3.5"/> Review Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailModal.isOpen && detailModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-blue-600" /> Product Review
              </h3>
              <button 
                onClick={() => setDetailModal({ isOpen: false, product: null })}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 md:p-8 overflow-y-auto flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 shrink-0">
                <div className="w-full aspect-square bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center p-2">
                  {detailModal.product.imageUrl ? (
                    <img src={detailModal.product.imageUrl} alt={detailModal.product.name} className="w-full h-full object-contain" />
                  ) : (
                    <Package className="w-16 h-16 text-slate-300" />
                  )}
                </div>
              </div>
              
              <div className="w-full md:w-2/3 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">{detailModal.product.brand || 'No Brand'}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">{detailModal.product.categoryId}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">{detailModal.product.name}</h2>
                </div>

                <div className="py-4 border-y border-slate-100 flex flex-wrap items-center gap-8">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Proposed Price</p>
                    <p className="text-2xl font-black text-cyan-600">${detailModal.product.price}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Initial Stock</p>
                    <p className="text-xl font-bold text-slate-800">{detailModal.product.stockQuantity || 0} units</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Description</h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {detailModal.product.description || 'No description provided by vendor.'}
                  </p>
                </div>

                {detailModal.product.specifications && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Specifications</h4>
                    <pre className="text-xs font-mono text-slate-700 bg-slate-800/5 p-4 rounded-xl border border-slate-200 overflow-x-auto">
                      {detailModal.product.specifications}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                disabled={saving}
                onClick={() => {
                  setRejectModal({ isOpen: true, productId: detailModal.product.productId, productName: detailModal.product.name, reason: '' });
                  setDetailModal({ isOpen: false, product: null });
                }}
                className="px-6 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors"
              >
                Reject Request
              </button>
              <button 
                disabled={saving}
                onClick={() => handleApproveProduct(detailModal.product)}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Approve Product
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-red-50">
              <h3 className="font-black text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Confirm Delete
              </h3>
              <button 
                onClick={() => setDeleteModal({ isOpen: false, productId: '' })}
                className="text-red-400 hover:text-red-700 hover:bg-red-100 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <p className="text-slate-800 font-bold mb-1">Are you absolutely sure?</p>
              <p className="text-sm text-slate-500">
                This product will be permanently removed from the system. This action cannot be undone.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setDeleteModal({ isOpen: false, productId: '' })}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDeleteProduct}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {discountModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Percent className="w-5 h-5 text-cyan-600" /> Set Product Discount
              </h3>
              <button onClick={() => setDiscountModal({ ...discountModal, isOpen: false })} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
                <p className="font-bold text-slate-800 line-clamp-2">{discountModal.productName}</p>
              </div>
              <div>
                <label className="flex justify-between items-center text-sm font-bold text-slate-700 mb-3">
                  Discount Percentage
                  <span className="text-2xl font-black text-cyan-600">{discountModal.discount}%</span>
                </label>
                <input type="range" min="0" max="99" value={discountModal.discount} onChange={(e) => setDiscountModal({...discountModal, discount: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600 mb-4" />
                <div className="relative">
                  <input type="number" min="0" max="99" value={discountModal.discount} onChange={(e) => setDiscountModal({...discountModal, discount: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 text-lg font-bold text-center" />
                  <Percent className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex gap-3">
              <button onClick={() => setDiscountModal({ ...discountModal, isOpen: false })} className="flex-1 py-3 bg-white border border-slate-200 font-bold rounded-xl text-slate-700">Cancel</button>
              <button onClick={handleSaveDiscount} disabled={saving} className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Discount'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-red-50">
              <h3 className="font-black text-red-600 flex items-center gap-2">Reject Product</h3>
              <button onClick={() => setRejectModal({ ...rejectModal, isOpen: false })} className="text-red-400 p-1.5"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
                <p className="font-bold text-slate-800 line-clamp-2">{rejectModal.productName}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Reason for Rejection <span className="text-red-500">*</span></label>
                <textarea rows={3} placeholder="Tell the vendor what needs to be fixed..." value={rejectModal.reason} onChange={(e) => setRejectModal({...rejectModal, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 outline-none bg-slate-50 text-sm" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex gap-3">
              <button onClick={() => setRejectModal({ ...rejectModal, isOpen: false })} className="flex-1 py-3 bg-white border border-slate-200 font-bold rounded-xl text-slate-700">Cancel</button>
              <button onClick={handleSaveReject} disabled={saving} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}