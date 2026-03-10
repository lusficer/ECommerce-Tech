'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Store, Package, TrendingUp, Plus, Settings, ShieldCheck, 
  Loader2, Search, CheckCircle2, Percent, Edit, Trash2
} from 'lucide-react';

export default function SellerDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'VENDOR' | 'MANAGER' | null>(null);
  const [userId, setUserId] = useState('');

  // States UI & Shop Data
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasShop, setHasShop] = useState(false);
  const [shopData, setShopData] = useState({ shopId: '', shopName: '', address: '', description: '', logoUrl: '', status: '' });
  const [saving, setSaving] = useState(false);

  // States Products & Approval
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  
  // States Form for Add/Edit
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); 
  const [productForm, setProductForm] = useState({ targetShopId: '', name: '', categoryId: 'CAT_PHONE', price: 0, discountPercentage: 0, description: '', imageUrl: '' });

  // States Vendor Shop Search
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState<any[]>([]);
  const [isSearchingShop, setIsSearchingShop] = useState(false);

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
    }else {
      toast.error('Access Denied. This dashboard is strictly for Sellers and Managers.');
      router.push('/'); 
      return;
    }
  }, [router]);

  // --- API FETCH LIST ---
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

  // Manager lấy sản phẩm của Shop
  const fetchManagerProducts = async (shopId: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:8083/api/manager/products`, { headers: { 'Authorization': `Bearer ${token}`, 'SHOP-ID': shopId } });
      if (res.ok) setMyProducts(await res.json());
    } catch (error) {}
  };

  // Vendor lấy sản phẩm của mình
  const fetchVendorProducts = async (shopId: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:8083/api/vendor/products`, { headers: { 'Authorization': `Bearer ${token}`, 'X-Shop-Id': shopId } });
      if (res.ok) setMyProducts(await res.json());
    } catch (error) {}
  };

  // --- API SEARCH SHOP ---
  const searchShops = async (keyword: string) => {
    setShopSearchQuery(keyword);
    if (!keyword.trim()) { 
      setShopSearchResults([]); 
      return; 
    }
    
    setIsSearchingShop(true);
    const token = localStorage.getItem('accessToken'); 

    try {
      const res = await fetch(`http://localhost:8082/api/shops/search?keyword=${encodeURIComponent(keyword)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      }); 
      
      if (res.ok) {
        const data = await res.json();
        setShopSearchResults(data);
      } else {
        console.error("Backend error:", await res.text());
      }
    } catch (error) { 
      console.error("API Search error:", error); 
    } finally { 
      setIsSearchingShop(false); 
    }
  };

  // --- MANAGER PRODUCT REVIEW ACTION ---
  const handleReviewProduct = async (productId: string, isApproved: boolean) => {
    let comments = "Approved"; let discount = 0;
    if (!isApproved) {
      const reason = prompt("Enter reason for rejection:");
      if (!reason) return; comments = reason;
    } else {
      const discountInput = prompt("Enter discount percentage (0-99):", "0");
      if (discountInput === null) return; discount = parseInt(discountInput) || 0;
    }
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:8083/api/manager/products/${productId}/review`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId: userId, approved: isApproved, comments, discountPercentage: discount })
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success(isApproved ? `Product Approved with ${discount}% discount!` : 'Product Rejected!');
      fetchApprovalQueue(token!, shopData.shopId); 
      fetchManagerProducts(shopData.shopId, token!);
    } catch (error: any) { toast.error(error.message); }
  };

  // --- ADD/EDIT PRODUCT ACTION ---
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
      // Reload list
      if(role === 'MANAGER') fetchManagerProducts(shopData.shopId, token!);
      else fetchVendorProducts(finalShopId, token!);
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  // Open Form to Edit
  const openEditForm = (product: any) => {
    setEditingId(product.productId);
    setProductForm({
      targetShopId: product.shopId,
      name: product.name,
      categoryId: product.categoryId || 'CAT_PHONE',
      price: product.price,
      discountPercentage: product.discountPercentage || 0,
      description: product.description || '',
      imageUrl: product.imageUrl || ''
    });
    setShopSearchQuery(product.shopId); 
    setShowProductForm(true);
  };

  // Open Form to Add
  const openAddForm = () => {
    setEditingId(null);
    setProductForm({ targetShopId: '', name: '', categoryId: 'CAT_PHONE', price: 0, discountPercentage: 0, description: '', imageUrl: '' });
    setShopSearchQuery('');
    setShowProductForm(true);
  };

  // --- DELETE PRODUCT ACTION ---
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`http://localhost:8083/api/${role?.toLowerCase()}/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted!');
      // Reload list
      if(role === 'MANAGER') fetchManagerProducts(shopData.shopId, token!);
      else fetchVendorProducts(productForm.targetShopId || 'SHOP_001', token!);
    } catch (error: any) { toast.error(error.message); }
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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 font-sans">
      <div className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600">Home</Link> <span className="mx-2">/</span> <span className="text-slate-900">Seller Center</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4 sticky top-28">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-500"><Store className="w-32 h-32 -mr-10 -mt-10" /></div>
             <div className="relative z-10">
               <h2 className="text-2xl font-black mb-1 leading-tight">{role === 'MANAGER' ? (shopData.shopName || 'Shop Manager') : 'Vendor Portal'}</h2>
               <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider mt-2">{role}</p>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col gap-1">
            <button onClick={() => {setActiveTab('dashboard'); setShowProductForm(false)}} className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <TrendingUp className="w-5 h-5" /> Overview
            </button>
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
                <div className="h-px bg-slate-100 my-2"></div>
                <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                  <Settings className="w-5 h-5" /> Shop Settings
                </button>
              </>
            )}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="w-full lg:w-3/4">
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {activeTab === 'dashboard' && (
               <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Welcome back!</h3>
                  <p className="text-slate-500">Manage your operations effectively.</p>
               </div>
            )}

            {/* TAB SẢN PHẨM */}
            {activeTab === 'products' && (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[600px]">
                {!showProductForm ? (
                  <div className="animate-in fade-in">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900">{role === 'MANAGER' ? 'Shop Inventory' : 'My Product Listings'}</h3>
                      
                      {/* CHỈ VENDOR MỚI THẤY NÚT ADD PRODUCT */}
                      {role === 'VENDOR' && (
                        <button onClick={openAddForm} className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm">
                          <Plus className="w-4 h-4" /> ADD PRODUCT
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-sm font-bold text-slate-400">
                            <th className="pb-3">Product</th>
                            <th className="pb-3">Price</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-slate-700">
                          {myProducts.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-10 text-slate-400">No products found.</td></tr>
                          )}
                          {myProducts.map((p) => (
                            <tr key={p.productId} className="border-b border-slate-50 hover:bg-slate-50">
                              <td className="py-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover"/> : <Package className="w-5 h-5 m-2.5 text-slate-400"/>}
                                </div>
                                <span className="font-bold line-clamp-1">{p.name}</span>
                              </td>
                              <td className="py-4 font-bold text-cyan-600">${p.price}</td>
                              <td className="py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  p.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                                  p.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {p.approvalStatus}
                                </span>
                              </td>
                              {/* BOTH MANAGER & VENDOR CAN EDIT/DELETE PRODUCTS IN THEIR LIST */}
                              <td className="py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => openEditForm(p)} className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteProduct(p.productId)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  // FORM THÊM/SỬA SẢN PHẨM CHUNG
                  <div className="animate-in slide-in-from-right-8 duration-300">
                    <button onClick={() => setShowProductForm(false)} className="text-sm font-bold text-slate-500 hover:text-cyan-600 mb-6 flex items-center gap-1">
                      ← Back to Products
                    </button>
                    <h3 className="text-xl font-black text-slate-900 mb-6">
                      {editingId ? 'Edit Product' : 'Create New Listing'}
                    </h3>
                    
                    <form className="space-y-5" onSubmit={handleProductSubmit}>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         
                         {/* THANH SEARCH SHOP (CHỈ VENDOR THẤY) */}
                         {role === 'VENDOR' && (
                           <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100 relative">
                             <label className="block text-sm font-black text-blue-900 mb-2">Search Partner Shop <span className="text-red-500">*</span></label>
                             <div className="relative">
                               <Search className="absolute left-3 top-3.5 w-4 h-4 text-blue-400" />
                               <input 
                                 type="text" 
                                 value={shopSearchQuery} 
                                 onChange={(e) => searchShops(e.target.value)}
                                 placeholder="Type shop name (e.g., TechZone)..." 
                                 className="w-full pl-9 pr-4 py-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none bg-white text-sm font-medium" 
                               />
                               {isSearchingShop && <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-blue-500" />}
                             </div>

                             {shopSearchResults.length > 0 && (
                                <ul className="absolute z-20 left-4 right-4 mt-1 bg-white border border-blue-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                  {shopSearchResults.map(shop => (
                                      <li key={shop.shopId} onClick={() => {
                                            setProductForm({...productForm, targetShopId: shop.shopId});
                                            setShopSearchQuery(shop.shopName);
                                            setShopSearchResults([]); 
                                         }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50">
                                         <div className="font-bold text-sm text-slate-800">{shop.shopName}</div>
                                         <div className="text-xs text-slate-400">ID: {shop.shopId}</div>
                                      </li>
                                  ))}
                                </ul>
                             )}
                             {productForm.targetShopId && (
                               <div className="mt-2 text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Selected: {productForm.targetShopId}</div>
                             )}
                           </div>
                         )}

                         <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Product Name <span className="text-red-500">*</span></label>
                           <input type="text" required value={productForm.name} onChange={(e)=>setProductForm({...productForm, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
                         </div>
                         <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Category <span className="text-red-500">*</span></label>
                           <select value={productForm.categoryId} onChange={(e)=>setProductForm({...productForm, categoryId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm">
                             <option value="CAT_PHONE">Smartphones</option>
                             <option value="CAT_LAPTOP">Laptops</option>
                             <option value="CAT_AUDIO">Audio</option>
                             <option value="CAT_ACCESSORY">Accessories</option>
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Regular Price ($) <span className="text-red-500">*</span></label>
                           <input type="number" step="0.01" required value={productForm.price} onChange={(e)=>setProductForm({...productForm, price: parseFloat(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
                         </div>
                         
                         {/* ONLY MANAGER CAN ENTER DISCOUNT */}
                         {role === 'MANAGER' && (
                           <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">Discount <Percent className="w-3.5 h-3.5"/></label>
                             <input type="number" min="0" max="99" value={productForm.discountPercentage} onChange={(e)=>setProductForm({...productForm, discountPercentage: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm" />
                           </div>
                         )}
                       </div>
                       
                       <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Product Image</label>
                         <input type="file" onChange={handleImageChange} accept="image/*" className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
                       </div>
                       
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                          <textarea rows={4} value={productForm.description} onChange={(e)=>setProductForm({...productForm, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"></textarea>
                       </div>
                       <div className="pt-4 flex justify-end gap-4">
                         <button type="submit" disabled={saving} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md">
                            {saving ? 'SAVING...' : (editingId ? 'UPDATE PRODUCT' : 'SUBMIT PRODUCT')}
                         </button>
                       </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB DUYỆT HÀNG (MANAGER ONLY) */}
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
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleReviewProduct(item.productId, false)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors font-bold text-xs">Reject</button>
                                <button onClick={() => handleReviewProduct(item.productId, true)} className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg transition-colors font-bold text-xs">Approve</button>
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
    </div>
  );
}