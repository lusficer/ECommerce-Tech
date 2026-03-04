'use client';

import React, { useState, useEffect, useRef } from 'react'; // 1. Thêm useRef
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  Store, Package, ShoppingBag, TrendingUp, 
  Plus, Settings, Star, ShieldCheck, Loader2, CheckCircle2, MapPin, Camera, X
} from 'lucide-react';

export default function SellerDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null); // 2. Ref để kích hoạt ô chọn file ẩn

  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userId, setUserId] = useState('');

  // States UI & Shop Data
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasShop, setHasShop] = useState(false);
  const [shopData, setShopData] = useState({
    shopId: '',
    shopName: '',
    address: '',
    description: '',
    logoUrl: '', // Đây là link ảnh
    status: ''
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUserId = localStorage.getItem('userId');

    if (!token || !storedUserId || !storedUserId.startsWith('SHOP_MNG')) {
      toast.error('Bạn không có quyền truy cập trang này!');
      router.push('/');
      return;
    }

    setUserId(storedUserId);
    setIsAuthorized(true);
    fetchShopData(storedUserId, token);
  }, [router]);

  // Gọi API lấy dữ liệu Shop
  const fetchShopData = async (ownerId: string, token: string) => {
    try {
      const response = await fetch(`http://localhost:8082/api/shops/owner/${ownerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const shops = await response.json();
        if (shops && shops.length > 0) {
          setHasShop(true);
          const myShop = shops[0];
          setShopData({
            shopId: myShop.shopId || '',
            shopName: myShop.shopName || '',
            address: myShop.address || '',
            description: myShop.description || '',
            logoUrl: myShop.logoUrl || '', // Backend trả về link ảnh
            status: myShop.status || 'ACTIVE'
          });
        } else {
          setHasShop(false);
        }
      }
    } catch (error) {
      console.error("Lỗi khi fetch shop:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShopData({ ...shopData, [e.target.name]: e.target.value });
  };

  // --- 3. XỬ LÝ CHỌN VÀ PREVIEW ẢNH (DÙNG BASE64 ĐỂ MOCKUP) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra định dạng file
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh (jpg, png...)');
        return;
      }
      // Kiểm tra dung lượng (ví dụ < 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Kích thước ảnh phải nhỏ hơn 2MB!');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Cập nhật logoUrl bằng chuỗi Base64 để hiển thị xem trước
        setShopData({ ...shopData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file); // Đọc file dưới dạng Base64
    }
  };

  // --- 4. GỌI API TẠO MỚI SHOP (POST /api/shops?ownerId=...) ---
  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`http://localhost:8082/api/shops?ownerId=${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Backend của bạn nhận @RequestBody UpdateShopProfileRequest (có logoUrl)
        body: JSON.stringify({
          shopName: shopData.shopName,
          address: shopData.address,
          description: shopData.description,
          logoUrl: shopData.logoUrl // Gửi chuỗi Base64 (hoặc link ảnh) xuống
        }),
      });

      if (!response.ok) throw new Error('Tạo Shop thất bại!');

      toast.success('Tạo Shop thành công!');
      fetchShopData(userId, token!); // Reload dữ liệu để lấy ShopId thật
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  // --- 5. GỌI API UPDATE PROFILE SHOP (PUT /api/shops/{shopId}/profile) ---
  const handleUpdateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`http://localhost:8082/api/shops/${shopData.shopId}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopName: shopData.shopName,
          address: shopData.address,
          description: shopData.description,
          logoUrl: shopData.logoUrl // Gửi dữ liệu ảnh đã cập nhật xuống
        }),
      });

      if (!response.ok) throw new Error('Cập nhật thất bại!');

      toast.success('Lưu thông tin Shop thành công!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 font-sans">
      <div className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600">Home</Link> <span className="mx-2">/</span> <span className="text-slate-900">Seller Center</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR DÀNH RIÊNG CHO SELLER (RÚT GỌN CHỈ CÒN ĐÚNG CÁI BẠN CẦN) */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4 sticky top-28">
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-500">
                <Store className="w-32 h-32 -mr-10 -mt-10" />
             </div>
             <div className="relative z-10">
               <h2 className="text-2xl font-black mb-1">Seller Center</h2>
               <p className="text-slate-400 text-sm font-medium">Manage your business</p>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col gap-1">
            <button onClick={() => setActiveTab('dashboard')} disabled={!hasShop} className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${!hasShop ? 'opacity-50 cursor-not-allowed' : activeTab === 'dashboard' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <TrendingUp className="w-5 h-5" /> Overview
            </button>
            <button onClick={() => setActiveTab('products')} disabled={!hasShop} className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${!hasShop ? 'opacity-50 cursor-not-allowed' : activeTab === 'products' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><Package className="w-5 h-5" /> Products</div>
            </button>
            <div className="h-px bg-slate-100 my-2"></div>
            <button onClick={() => setActiveTab('settings')} disabled={!hasShop} className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${!hasShop ? 'opacity-50 cursor-not-allowed' : activeTab === 'settings' ? 'bg-cyan-50 text-cyan-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings className="w-5 h-5" /> Shop Settings
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="w-full lg:w-3/4">
          
          {/* MÀN HÌNH CHƯA CÓ SHOP (BẮT BUỘC TẠO) */}
          {!hasShop ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm min-h-[500px] animate-in fade-in duration-300">
               <div className="max-w-xl mx-auto text-center">
                 <div className="w-20 h-20 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Store className="w-10 h-10" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 mb-2">Initialize Your Shop</h2>
                 <p className="text-slate-500 mb-8">One manager can only own one shop. Let's set up the basic information for your tech store.</p>
                 
                 <form className="text-left space-y-5" onSubmit={handleCreateShop}>
                    {/* --- 6. Ô CHỌN ẢNH THÔNG MINH CHO TẠO SHOP --- */}
                    <div className="flex flex-col items-center mb-8">
                      <label className="block text-sm font-bold text-slate-700 mb-3 text-center">Shop Logo</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()} // Kích hoạt chọn file
                        className="w-28 h-28 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all relative group overflow-hidden shadow-inner"
                      >
                        {shopData.logoUrl ? (
                          // Hiển thị ảnh xem trước
                          <img src={shopData.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                        ) : (
                          // Hiển thị icon mặc định
                          <>
                            <Camera className="w-8 h-8 mb-1" />
                            <span className="text-xs font-medium">Upload</span>
                          </>
                        )}
                        {/* Lớp overlay khi hover */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Max 2MB. JPG, PNG</p>
                    </div>
                    {/* Ô chọn file ẩn */}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Shop Name <span className="text-red-500">*</span></label>
                      <input type="text" name="shopName" value={shopData.shopName} onChange={handleInputChange} required placeholder="Ex: TechZone Official" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Shop Address <span className="text-red-500">*</span></label>
                      <input type="text" name="address" value={shopData.address} onChange={handleInputChange} required placeholder="123 Tech Street, NY" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                      <textarea name="description" value={shopData.description} onChange={handleInputChange} rows={3} placeholder="Tell customers what you sell..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm"></textarea>
                    </div>
                    <button type="submit" disabled={saving} className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2">
                      {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                      {saving ? 'CREATING...' : 'CREATE SHOP'}
                    </button>
                 </form>
               </div>
            </div>
          ) : (
            /* MÀN HÌNH ĐÃ CÓ SHOP */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Header Shop rực rỡ (tái tạo Figma) */}
              <div className="bg-cyan-600 rounded-3xl p-6 lg:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center gap-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-overlay">
                {/* HIỂN THỊ LOGO THẬT TỪ DATABASE */}
                <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner relative shrink-0 overflow-hidden border-2 border-white/50">
                   {shopData.logoUrl ? (
                      <img src={shopData.logoUrl} alt="Shop Logo" className="w-full h-full object-cover" />
                   ) : (
                      // Nếu không có ảnh, dùng chữ cái đầu
                      shopData.shopName.substring(0, 2).toUpperCase() || 'TS'
                   )}
                </div>
                <div className="flex-grow text-center sm:text-left">
                  <h1 className="text-3xl font-black flex items-center justify-center sm:justify-start gap-2">
                    {shopData.shopName || 'TechZone Official'} <ShieldCheck className="w-5 h-5 text-green-300" />                  </h1>
                  <p className="text-cyan-100 font-medium mt-1 flex items-center justify-center sm:justify-start gap-1"><MapPin className="w-4 h-4"/> {shopData.address || '123 Tech Street, NY'}</p>
                </div>
                <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/30 font-bold tracking-widest uppercase text-sm">
                   {shopData.status || 'ACTIVE'}
                </div>
              </div>

              {activeTab === 'dashboard' && (
                 <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
                    <h3 className="text-xl font-black text-slate-900 mb-6">Overview</h3>
                    <p className="text-slate-500">Thống kê doanh thu và đơn hàng sẽ hiển thị ở đây.</p>
                 </div>
              )}

              {/* TAB SETTINGS - CẬP NHẬT PROFILE SHOP VÀ LOGO */}
              {activeTab === 'settings' && (
                 <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px] animate-in fade-in">
                    <h3 className="text-xl font-black text-slate-900 mb-6">Shop Configuration</h3>
                    
                    <form className="space-y-5 max-w-2xl" onSubmit={handleUpdateShop}>
                      
                      {/* --- Ô CHỌN ẢNH THÔNG MINH CHO CẬP NHẬT --- */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Shop Logo</label>
                        <div className="flex items-center gap-5 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                          {/* Nút bấm thông minh */}
                          <div 
                             onClick={() => fileInputRef.current?.click()} // Kích hoạt chọn file
                             className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all relative group overflow-hidden"
                          >
                             {shopData.logoUrl ? (
                               <img src={shopData.logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                             ) : (
                               <>
                                 <Camera className="w-6 h-6 mb-1" />
                                 <span className="text-[10px] font-medium">Upload</span>
                               </>
                             )}
                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-5 h-5 text-white" />
                             </div>
                          </div>
                          
                          <div>
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-all text-xs flex items-center gap-1.5 shadow-sm">
                               <Camera className="w-3.5 h-3.5" /> CHANGE LOGO
                            </button>
                            <p className="text-[11px] text-slate-400 mt-2">Maximum file size: 2MB.<br/>Supported: JPG, PNG, WEBP.</p>
                          </div>
                        </div>
                      </div>
                      {/* Ô chọn file ẩn (Tái sử dụng chung) */}
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />


                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Shop Name</label>
                        <input type="text" name="shopName" value={shopData.shopName} onChange={handleInputChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                        <input type="text" name="address" value={shopData.address} onChange={handleInputChange} required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                        <textarea name="description" value={shopData.description} onChange={handleInputChange} rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm"></textarea>
                      </div>
                      
                      <button type="submit" disabled={saving} className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 mt-4 transition-all hover:-translate-y-0.5 shadow-cyan-600/20 hover:shadow-cyan-600/40">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {saving ? 'SAVING...' : 'SAVE CHANGES'}
                      </button>
                    </form>
                 </div>
              )}

              {/* TAB QUẢN LÝ SẢN PHẨM (MOCKUP) */}
              {activeTab === 'products' && (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
                   <h3 className="text-xl font-black text-slate-900 mb-6">Product Management</h3>
                   <p className="text-slate-500 py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">Mockup quản lý sản phẩm sẽ ở đây.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}