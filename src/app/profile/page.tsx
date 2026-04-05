'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { apiGet, apiPut } from '@/lib/api';
import { getAuth, getStoredRole, logout as clearAuth } from '@/lib/auth';
import type { Shop, UpdateShopProfileRequest } from '@/types';
import { 
  User, MapPin, Lock, Loader2, LogOut, ShieldCheck, EyeOff, Eye,
  Store, Truck, ClipboardList,
} from 'lucide-react';

type AppRole = 'CUSTOMER' | 'VENDOR' | 'MANAGER' | 'SHIPPER' | string;

type ShopProfileFormState = {
  shopName: string;
  phone: string;
  address: string;
  logoUrl: string;
  description: string;
  warehouseAddress: string;
  warehouseCity: string;
  warehouseDistrict: string;
  warehouseWard: string;
  warehousePhone: string;
};

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const shopToFormState = (shop: Shop): ShopProfileFormState => ({
  shopName: shop.shopName ?? '',
  phone: shop.phone ?? '',
  address: shop.address ?? '',
  logoUrl: shop.logoUrl ?? '',
  description: shop.description ?? '',
  warehouseAddress: (shop.warehouseAddress ?? '') as string,
  warehouseCity: (shop.warehouseCity ?? '') as string,
  warehouseDistrict: (shop.warehouseDistrict ?? '') as string,
  warehouseWard: (shop.warehouseWard ?? '') as string,
  warehousePhone: (shop.warehousePhone ?? '') as string,
});

const buildUpdatePayload = (
  initial: ShopProfileFormState,
  current: ShopProfileFormState
): UpdateShopProfileRequest => {
  const payload: UpdateShopProfileRequest = {};

  const entries: Array<[keyof ShopProfileFormState, keyof UpdateShopProfileRequest]> = [
    ['shopName', 'shopName'],
    ['phone', 'phone'],
    ['address', 'address'],
    ['logoUrl', 'logoUrl'],
    ['description', 'description'],
    ['warehouseAddress', 'warehouseAddress'],
    ['warehouseCity', 'warehouseCity'],
    ['warehouseDistrict', 'warehouseDistrict'],
    ['warehouseWard', 'warehouseWard'],
    ['warehousePhone', 'warehousePhone'],
  ];

  for (const [formKey, payloadKey] of entries) {
    const nextVal = toTrimmedString(current[formKey]);
    const prevVal = toTrimmedString(initial[formKey]);

    // Only send non-empty (trim) fields, and only when changed.
    if (nextVal && nextVal !== prevVal) {
      payload[payloadKey] = nextVal as any;
    }
  }

  return payload;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [shopsLoading, setShopsLoading] = useState(false);
  const [assignedShops, setAssignedShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [shopDetailLoading, setShopDetailLoading] = useState(false);
  const [savingShopProfile, setSavingShopProfile] = useState(false);

  const [shopForm, setShopForm] = useState<ShopProfileFormState>({
    shopName: '',
    phone: '',
    address: '',
    logoUrl: '',
    description: '',
    warehouseAddress: '',
    warehouseCity: '',
    warehouseDistrict: '',
    warehouseWard: '',
    warehousePhone: '',
  });
  const [shopInitial, setShopInitial] = useState<ShopProfileFormState>({
    shopName: '',
    phone: '',
    address: '',
    logoUrl: '',
    description: '',
    warehouseAddress: '',
    warehouseCity: '',
    warehouseDistrict: '',
    warehouseWard: '',
    warehousePhone: '',
  });

  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<AppRole>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    const { token, userId: storedUserId } = getAuth();

    if (!token || !storedUserId) {
      toast.error('Please login to view your profile!');
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    // Prefer explicit stored role when available; fallback to profile fetch.
    const storedRole = getStoredRole();
    if (storedRole) setRole(storedRole);
    fetchProfileData(storedUserId);
  }, [router]);

  useEffect(() => {
    const normalized = String(role || inferRoleFromUserId(userId) || '').toUpperCase();

    const isInternal =
      normalized === 'VENDOR' ||
      normalized === 'MANAGER' ||
      normalized === 'SHOP_MANAGER' ||
      normalized === 'SHOP MANAGER';

    if (!userId || !isInternal) return;

    let cancelled = false;
    const run = async () => {
      setShopsLoading(true);
      try {
        const isManagerLike =
          normalized === 'MANAGER' ||
          normalized === 'SHOP_MANAGER' ||
          normalized === 'SHOP MANAGER' ||
          normalized.includes('SHOP_MNG') ||
          userId.startsWith('SHOP_MNG');

        const shops = isManagerLike
          ? await apiGet<Shop[]>('shop', `/api/shops/owner/${userId}`, { withUserId: false })
          : await apiGet<Shop[]>('shop', '/api/shops/my-assigned-shops', {
              headers: { userId },
              withUserId: false,
            });
        if (cancelled) return;

        const list = Array.isArray(shops) ? shops : [];
        setAssignedShops(list);
        if (!selectedShopId && list.length > 0) {
          setSelectedShopId(list[0].shopId);
        }
        if (list.length === 0) {
          setSelectedShopId('');
          const msg = isManagerLike
            ? "You don't own any shops."
            : "You are not assigned to manage any Shop!";
          toast.error(msg);
        }
      } catch (error: any) {
        if (!cancelled) toast.error(error.message);
      } finally {
        if (!cancelled) setShopsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // Intentionally not depending on selectedShopId to avoid refetch loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, role]);

  useEffect(() => {
    if (!selectedShopId) return;

    let cancelled = false;
    const run = async () => {
      setShopDetailLoading(true);
      try {
        const detail = await apiGet<Shop>('shop', `/api/shops/${selectedShopId}`);
        if (cancelled) return;
        const next = shopToFormState(detail);
        setShopForm(next);
        setShopInitial(next);
      } catch (error: any) {
        if (!cancelled) toast.error(error.message);
      } finally {
        if (!cancelled) setShopDetailLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedShopId]);

  const inferRoleFromUserId = (id: string): AppRole => {
    if (id.startsWith('SHOP_MNG')) return 'MANAGER';
    if (id.startsWith('VEND')) return 'VENDOR';
    if (id.startsWith('SHIPPER')) return 'SHIPPER';
    return 'CUSTOMER';
  };

  const fetchProfileData = async (id: string) => {
    try {
      const data = await apiGet<any>('user', `/api/account/status/${id}`, { withUserId: false });
      if (data.profile) {
        setFormData({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
        });
      }

      const resolvedRole: AppRole = data?.role || data?.profile?.role || role || inferRoleFromUserId(id);
      setRole(resolvedRole);
      if (resolvedRole && typeof window !== 'undefined') {
        localStorage.setItem('role', String(resolvedRole));
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleShopFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setShopForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveShopProfile = async () => {
    const canEdit = userId.startsWith('SHOP_MNG') || String(role || '').toUpperCase() === 'SHOP_MANAGER';
    if (!canEdit) {
      toast.error('Your role has read-only access.');
      return;
    }

    if (!selectedShopId) {
      toast.error('Please select a shop first.');
      return;
    }

    const payload = buildUpdatePayload(shopInitial, shopForm);
    if (Object.keys(payload).length === 0) {
      toast('Nothing to update');
      return;
    }

    const ok = window.confirm(
      'This will update shop profile and warehouse pickup info. Shippers may use this address for pickup.'
    );
    if (!ok) return;

    setSavingShopProfile(true);
    try {
      await apiPut('shop', `/api/shops/${selectedShopId}/profile`, payload, { withUserId: false });
      toast.success('Shop profile updated successfully!');

      // Reload shop detail to sync and reset initial snapshot.
      const detail = await apiGet<Shop>('shop', `/api/shops/${selectedShopId}`);
      const next = shopToFormState(detail);
      setShopForm(next);
      setShopInitial(next);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingShopProfile(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await apiPut('user', `/api/account/details/${userId}`, formData, { withUserId: false });
      toast.success('Update profile successful!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    setChangingPassword(true);

    try {
      await apiPut(
        'user',
        '/api/account/security',
        { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword },
        { withUserId: false }
      );
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    toast.success('Successfully logged out!');
    router.push('/login');
  };

  const getRoleBadge = (r: AppRole, id: string) => {
    const normalized = String(r || '').toUpperCase();
    if (normalized === 'MANAGER' || normalized === 'SHOP_MANAGER' || id.startsWith('SHOP_MNG')) return { text: 'Shop Manager', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    if (normalized === 'VENDOR' || id.startsWith('VEND')) return { text: 'Vendor', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (normalized === 'SHIPPER' || id.startsWith('SHIPPER')) return { text: 'Shipper', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { text: 'Customer', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  const roleBadge = getRoleBadge(role, userId);
  const normalizedRole = String(roleBadge.text || role || '').toUpperCase();
  const isCustomer = normalizedRole === 'CUSTOMER';
  const isVendor = normalizedRole === 'VENDOR';
  const isManager =
    normalizedRole === 'SHOP MANAGER' ||
    normalizedRole === 'MANAGER' ||
    String(role || '').toUpperCase() === 'SHOP_MANAGER' ||
    userId.startsWith('SHOP_MNG');
  const isShipper = normalizedRole === 'SHIPPER';
  const showShopWarehouse = isVendor || isManager;
  const canEditShopProfile = isManager;
  const staffPortalLink =
    normalizedRole === 'VENDOR'
      ? { href: '/seller', label: 'Vendor Portal', icon: <Store className="w-5 h-5" /> }
      : normalizedRole === 'SHOP MANAGER' || normalizedRole === 'MANAGER'
      ? { href: '/seller', label: 'Manager Portal', icon: <ClipboardList className="w-5 h-5" /> }
      : normalizedRole === 'SHIPPER'
      ? { href: '/shipper/orders', label: 'Shipper Portal', icon: <Truck className="w-5 h-5" /> }
      : null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 mb-20 font-sans">
      
      <div className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600">Home</Link> <span className="mx-2">/</span> pages <span className="mx-2">/</span> <span className="text-slate-900">profile</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        <div className="w-full lg:w-1/4 flex flex-col gap-6 sticky top-28">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col items-center text-center shadow-sm">
            <div className="w-28 h-28 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md relative overflow-hidden">
               <User className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">{formData.name || 'User'}</h2>
            <p className="text-sm font-medium text-slate-500 mb-3">{formData.email}</p>
            
            <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${roleBadge.color}`}>
              <ShieldCheck className="w-3 h-3" />
              {roleBadge.text}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col gap-1">
            <button onClick={() => setActiveTab('account')} className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'account' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><User className="w-5 h-5" /> Account Info</div>
            </button>

            {isCustomer && (
              <button onClick={() => setActiveTab('address')} className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'address' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-600 hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3"><MapPin className="w-5 h-5" /> My Address</div>
              </button>
            )}

            {!isCustomer && staffPortalLink && (
              <Link
                href={staffPortalLink.href}
                className="flex items-center justify-between p-4 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all w-full text-left"
              >
                <div className="flex items-center gap-3">{staffPortalLink.icon} {staffPortalLink.label}</div>
              </Link>
            )}

            {showShopWarehouse && (
              <button
                onClick={() => setActiveTab('shopWarehouse')}
                className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'shopWarehouse' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3"><Store className="w-5 h-5" /> Shop & Warehouse</div>
              </button>
            )}

            <button onClick={() => setActiveTab('security')} className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'security' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><Lock className="w-5 h-5" /> Change Password</div>
            </button>
            <div className="h-px bg-slate-100 my-2"></div>
            <button onClick={handleLogout} className="flex items-center gap-3 p-4 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all">
              <LogOut className="w-5 h-5" /> Log Out
            </button>
          </div>
        </div>

        <div className="w-full lg:w-3/4">
          
          {activeTab === 'account' && (
            <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm min-h-[600px] animate-in fade-in duration-300">
              <h1 className="text-2xl font-black text-slate-900 mb-8">Account Info</h1>
              <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900" />
                </div>
                <button type="submit" disabled={saving} className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl mt-4 transition-all shadow-md shadow-cyan-600/20 hover:shadow-cyan-600/40 hover:-translate-y-0.5 disabled:opacity-70 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
             <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm min-h-[600px] animate-in fade-in duration-300">
               <h1 className="text-2xl font-black text-slate-900 mb-8">Change Password</h1>
               
               <form onSubmit={handleUpdatePassword} className="max-w-2xl space-y-6">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                   <div className="relative">
                     <input 
                       type={showPassword ? "text" : "password"} 
                       name="currentPassword"
                       required
                       value={passwordData.currentPassword}
                       onChange={handlePasswordChangeInput}
                       placeholder="••••••••"
                       className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900" 
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                     <div className="relative">
                       <input 
                         type={showPassword ? "text" : "password"} 
                         name="newPassword"
                         required
                         minLength={6}
                         value={passwordData.newPassword}
                         onChange={handlePasswordChangeInput}
                         placeholder="••••••••"
                         className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900" 
                       />
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                     <div className="relative">
                       <input 
                         type={showPassword ? "text" : "password"} 
                         name="confirmPassword"
                         required
                         minLength={6}
                         value={passwordData.confirmPassword}
                         onChange={handlePasswordChangeInput}
                         placeholder="••••••••"
                         className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900" 
                       />
                     </div>
                   </div>
                 </div>

                 <div className="flex items-center justify-end">
                   <button 
                     type="button" 
                     onClick={() => setShowPassword(!showPassword)}
                     className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-cyan-600 transition-colors"
                   >
                     {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                     {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                   </button>
                 </div>

                 <button 
                   type="submit" 
                   disabled={changingPassword}
                   className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl mt-4 transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                   {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                   {changingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}
                 </button>
               </form>
             </div>
          )}

          {activeTab === 'shopWarehouse' && showShopWarehouse && (
            <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm min-h-[600px] animate-in fade-in duration-300">
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Shop & Warehouse</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    If warehouse fields are empty, backend will fallback to shop address/phone.
                  </p>
                </div>

                {!canEditShopProfile && (
                  <div className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold">
                    Read-only for your role
                  </div>
                )}
              </div>

              <div className="max-w-3xl space-y-8">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Select Shop</label>
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedShopId}
                      onChange={(e) => setSelectedShopId(e.target.value)}
                      disabled={shopsLoading || assignedShops.length === 0}
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {assignedShops.length === 0 ? (
                        <option value="">{isManager ? 'No owned shops' : 'No assigned shops'}</option>
                      ) : (
                        assignedShops.map((s) => (
                          <option key={s.shopId} value={s.shopId}>
                            {s.shopName || s.shopId}
                          </option>
                        ))
                      )}
                    </select>

                    {(shopsLoading || shopDetailLoading) && (
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                    )}
                  </div>
                  {assignedShops.length === 0 && !shopsLoading && (
                    <p className="text-sm text-slate-500">
                      {isManager ? "You don't own any shops." : "You don't have any assigned shops."}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-black text-slate-900 mb-4">Shop Contact</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Shop Name</label>
                        <input
                          name="shopName"
                          value={shopForm.shopName}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                        <input
                          name="phone"
                          value={shopForm.phone}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                        <input
                          name="address"
                          value={shopForm.address}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Logo URL</label>
                        <input
                          name="logoUrl"
                          value={shopForm.logoUrl}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                        <textarea
                          name="description"
                          value={shopForm.description}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          rows={4}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-6">
                    <h2 className="text-lg font-black text-slate-900 mb-1">Warehouse Pickup (for Shipper)</h2>
                    <p className="text-sm text-slate-500 mb-4">
                      If warehouse fields are empty, backend will fallback to shop address/phone.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Warehouse Address</label>
                        <input
                          name="warehouseAddress"
                          value={shopForm.warehouseAddress}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                        <input
                          name="warehouseCity"
                          value={shopForm.warehouseCity}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">District</label>
                        <input
                          name="warehouseDistrict"
                          value={shopForm.warehouseDistrict}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ward</label>
                        <input
                          name="warehouseWard"
                          value={shopForm.warehouseWard}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Warehouse Phone</label>
                        <input
                          name="warehousePhone"
                          value={shopForm.warehousePhone}
                          onChange={handleShopFormChange}
                          disabled={!canEditShopProfile || shopDetailLoading || shopsLoading || savingShopProfile}
                          className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSaveShopProfile}
                    disabled={!canEditShopProfile || savingShopProfile || shopsLoading || shopDetailLoading || !selectedShopId}
                    className="px-8 py-3.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition-all shadow-md shadow-cyan-600/20 hover:shadow-cyan-600/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingShopProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    {savingShopProfile ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm min-h-[600px] animate-in fade-in duration-300 flex flex-col items-center justify-center text-slate-400">
               <MapPin className="w-16 h-16 mb-4 opacity-50" />
               <p className="font-bold text-lg text-slate-500">Address Book</p>
               <p className="text-sm">Manage your delivery addresses here.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}