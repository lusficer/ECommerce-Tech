'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { getAuth, logout } from '@/lib/auth';
import { apiDelete, apiGet, apiPost, apiPut, getUserFacingErrorMessage, isApiError } from '@/lib/api';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Sidebar from '@/components/seller/Sidebar';
import DashboardTab from '@/components/seller/DashboardTab';
import ProductsTab from '@/components/seller/ProductsTab';
import ProductForm, { ProductFormData } from '@/components/seller/ProductForm';
import ApprovalTab from '@/components/seller/ApprovalTab';
import DisputesTab from '@/components/seller/DisputesTab';
import type { Shop, UpdateShopProfileRequest } from '@/types';
import {
  ProductReviewModal, DiscountModal, RejectModal, DeleteConfirmModal,
} from '@/components/seller/SellerModals';

type Role = 'VENDOR' | 'MANAGER' | 'SHIPPER';

const DEFAULT_FORM: ProductFormData = {
  targetShopId: '', name: '', categoryId: 'CAT_PHONE',
  price: 0, discountPercentage: 0, stockQuantity: 0,
  imageUrl: '', description: '', brand: '', specifications: '',
};

export default function SellerDashboard() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [role, setRole]         = useState<Role | null>(null);
  const [userId, setUserId]     = useState('');
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [shopData, setShopData]       = useState({ shopId: '', shopName: '', address: '', description: '', logoUrl: '', status: '' });
  const [saving, setSaving]           = useState(false);
  const [myProducts, setMyProducts]   = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  // Current shopId for VENDOR (from my-assigned-shops; no hardcoding)
  const [vendorShopId, setVendorShopId] = useState<string>('');
  const [vendorShops, setVendorShops]   = useState<{ shopId: string; shopName: string }[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsShop, setSettingsShop] = useState<Shop | null>(null);
  const [settingsForm, setSettingsForm] = useState<UpdateShopProfileRequest>({
    shopName: '',
    description: '',
    logoUrl: '',
    address: '',
    phone: '',
    warehouseAddress: '',
    warehouseCity: '',
    warehouseDistrict: '',
    warehouseWard: '',
    warehousePhone: '',
  });
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [productForm, setProductForm]         = useState<ProductFormData>(DEFAULT_FORM);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState<any[]>([]);
  const [isSearchingShop, setIsSearchingShop] = useState(false);
  const [discountModal, setDiscountModal] = useState({ isOpen: false, productId: '', productName: '', discount: 0 });
  const [rejectModal, setRejectModal]     = useState({ isOpen: false, productId: '', productName: '', reason: '' });
  const [deleteModal, setDeleteModal]     = useState({ isOpen: false, productId: '' });
  const [detailModal, setDetailModal]     = useState({ isOpen: false, product: null as any });

  const handleSessionExpired = (err: unknown): boolean => {
    if (isApiError(err) && (err.status === 401 || err.status === 403)) {
      logout();
      toast.error('Your session has expired. Please sign in again.');
      router.push('/login');
      return true;
    }
    return false;
  };

  useEffect(() => {
    const { token, userId: uid } = getAuth();
    if (!token || !uid) { toast.error('Please sign in to continue.'); router.push('/login'); return; }
    setUserId(uid);

    if (uid.startsWith('SHOP_MNG')) {
      setRole('MANAGER');
      fetchShopData(uid, 'MANAGER');
    } else if (uid.startsWith('VEND')) {
      setRole('VENDOR');
      // Fetch shops assigned to the vendor; use the first shop to load products
      (async () => {
        try {
          const shops = await apiGet<any[]>('shop', '/api/shops/my-assigned-shops', {
            withAuth: true,
            withUserId: true,
          });
          if (shops?.length > 0) {
            const firstShopId = shops[0].shopId;
            setVendorShops(shops);
            setVendorShopId(firstShopId);
            fetchVendorProducts(firstShopId);
          }
        } catch (err) {
          if (handleSessionExpired(err)) return;
          toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to load assigned shops.' }));
        } finally {
          setLoading(false);
        }
      })();
    } else if (uid.startsWith('SHIPPER')) {
      setRole('SHIPPER');
      setLoading(false);
    } else {
      toast.error('Access Denied. This dashboard is for internal staff only.');
      router.push('/');
    }
  }, [router]);

  // Allow deep-linking to a specific tab (used by notifications).
  useEffect(() => {
    if (!role) return;

    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const tab = (sp.get('tab') || '').toLowerCase();
    const allowedTabs = new Set(['dashboard', 'products', 'approval', 'disputes', 'settings']);
    if (!allowedTabs.has(tab)) return;

    // Prevent invalid staff roles from landing on unsupported tabs.
    if (role === 'SHIPPER' && tab !== 'dashboard') return;
    if (role !== 'MANAGER' && tab === 'approval') return;

    setActiveTab(tab);
    setShowProductForm(false);

    // Clean up the URL so the tab doesn't get re-applied on future state changes.
    router.replace('/seller');
  }, [role, router]);

  const fetchShopData = async (ownerId: string, r: string) => {
    try {
      const shops = await apiGet<any[]>('shop', `/api/shops/owner/${encodeURIComponent(ownerId)}`);
      if (shops?.length > 0) {
        setShopData(shops[0]);
        if (r === 'MANAGER') {
          fetchApprovalQueue(shops[0].shopId);
          fetchManagerProducts(shops[0].shopId);
        }
      }
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to load shop data.' }));
      }
    } finally { setLoading(false); }
  };

  const fetchApprovalQueue = async (shopId: string) => {
    try {
      const queue = await apiGet<any[]>('product', '/api/manager/products/queue', {
        headers: { 'SHOP-ID': shopId },
      });
      setApprovalQueue(queue);
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to load approval queue.' }));
      }
    }
  };

  const fetchManagerProducts = async (shopId: string) => {
    try {
      const products = await apiGet<any[]>('product', '/api/manager/products', {
        headers: { 'SHOP-ID': shopId },
      });
      setMyProducts(products);
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to load products.' }));
      }
    }
  };

  const fetchVendorProducts = async (shopId: string) => {
    try {
      const products = await apiGet<any[]>('product', '/api/vendor/products', {
        headers: { 'X-Shop-Id': shopId },
      });
      setMyProducts(products);
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to load products.' }));
      }
    }
  };

  const searchShops = async (keyword: string) => {
    setShopSearchQuery(keyword);
    if (!keyword.trim()) { setShopSearchResults([]); return; }
    setIsSearchingShop(true);
    try {
      const shops = await apiGet<any[]>(
        'shop',
        `/api/shops/search?keyword=${encodeURIComponent(keyword)}`
      );
      setShopSearchResults(shops);
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to search shops.' }));
      }
    } finally { setIsSearchingShop(false); }
  };

  const handleApproveProduct = async (product: any) => {
    setSaving(true);
    try {
      await apiPost(
        'product',
        `/api/manager/products/${encodeURIComponent(product.productId)}/review`,
        { managerId: userId, approved: true, comments: 'Approved', discountPercentage: product.discountPercentage || 0 }
      );
      toast.success('Product Approved successfully!');
      fetchApprovalQueue(shopData.shopId);
      fetchManagerProducts(shopData.shopId);
      setDetailModal({ isOpen: false, product: null });
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to approve product.' }));
      }
    }
    finally { setSaving(false); }
  };

  const handleSaveReject = async () => {
    if (!rejectModal.reason.trim()) { toast.error('Please provide a reason for rejection'); return; }
    setSaving(true);
    try {
      await apiPost(
        'product',
        `/api/manager/products/${encodeURIComponent(rejectModal.productId)}/review`,
        { managerId: userId, approved: false, comments: rejectModal.reason, discountPercentage: 0 }
      );
      toast.success('Product Rejected!');
      fetchApprovalQueue(shopData.shopId);
      fetchManagerProducts(shopData.shopId);
      setRejectModal({ ...rejectModal, isOpen: false, reason: '' });
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to reject product.' }));
      }
    }
    finally { setSaving(false); }
  };

  const handleSaveDiscount = async () => {
    setSaving(true);
    try {
      await apiPut(
        'product',
        `/api/manager/products/${encodeURIComponent(discountModal.productId)}/discount?percentage=${encodeURIComponent(
          String(discountModal.discount)
        )}&managerId=${encodeURIComponent(userId)}`,
        undefined,
        { headers: { 'SHOP-ID': shopData.shopId } }
      );
      toast.success('Discount updated successfully!');
      fetchManagerProducts(shopData.shopId);
      fetchApprovalQueue(shopData.shopId);
      setDiscountModal({ ...discountModal, isOpen: false });
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to update discount.' }));
      }
    }
    finally { setSaving(false); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'VENDOR') { toast.error('Only Vendor can update products!'); return; }
    if (!productForm.targetShopId) { toast.error('Please select a partner shop!'); return; }
    setSaving(true);
    try {
      const payload = { ...productForm, shopId: productForm.targetShopId };
      if (editingId) {
        await apiPut('product', `/api/vendor/products/${encodeURIComponent(editingId)}`, payload, {
          headers: { 'X-Shop-Id': productForm.targetShopId },
        });
      } else {
        await apiPost('product', '/api/vendor/products', payload, {
          headers: { 'X-Shop-Id': productForm.targetShopId },
        });
      }
      toast.success(editingId ? 'Product updated successfully!' : 'Product submitted successfully!');
      setShowProductForm(false);
      fetchVendorProducts(productForm.targetShopId);
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to save product.' }));
      }
    }
    finally { setSaving(false); }
  };

  const executeDeleteProduct = async () => {
    setSaving(true);
    try {
      if (!role) throw new Error('Role not available');
      await apiDelete('product', `/api/${role.toLowerCase()}/products/${encodeURIComponent(deleteModal.productId)}`);
      toast.success('Product deleted successfully!');
      if (role === 'MANAGER') fetchManagerProducts(shopData.shopId);
      else fetchVendorProducts(productForm.targetShopId || vendorShopId);
      setDeleteModal({ isOpen: false, productId: '' });
    } catch (err) {
      if (!handleSessionExpired(err)) {
        toast.error(getUserFacingErrorMessage(err, { defaultMessage: 'Failed to delete product.' }));
      }
    }
    finally { setSaving(false); }
  };

  const openEditForm = (product: any) => {
    setEditingId(product.productId);
    setProductForm({
      targetShopId: product.shopId, name: product.name, categoryId: product.categoryId || 'CAT_PHONE',
      price: product.price, discountPercentage: product.discountPercentage || 0,
      stockQuantity: product.stockQuantity || 0, description: product.description || '',
      imageUrl: product.imageUrl || '', brand: product.brand || '', specifications: product.specifications || '',
    });
    setShopSearchQuery(product.shopId);
    setShowProductForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductForm((f) => ({ ...f, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (tab: string) => { setActiveTab(tab); setShowProductForm(false); };

  const settingsShopId = role === 'VENDOR' ? vendorShopId : shopData.shopId;

  useEffect(() => {
    if (activeTab !== 'settings') return;
    if (!settingsShopId) return;
    if (role === 'SHIPPER') return;

    const load = async () => {
      setSettingsLoading(true);
      try {
        const shop = await apiGet<Shop>('shop', `/api/shops/${settingsShopId}`);
        setSettingsShop(shop);
        setSettingsForm({
          shopName: shop.shopName || '',
          description: shop.description || '',
          logoUrl: shop.logoUrl || '',
          address: shop.address || '',
          phone: shop.phone || '',
          warehouseAddress: shop.warehouseAddress || '',
          warehouseCity: shop.warehouseCity || '',
          warehouseDistrict: shop.warehouseDistrict || '',
          warehouseWard: shop.warehouseWard || '',
          warehousePhone: shop.warehousePhone || '',
        });
      } catch (e: any) {
        if (!handleSessionExpired(e)) {
          toast.error(getUserFacingErrorMessage(e, { defaultMessage: 'Failed to load shop profile.' }));
        }
      } finally {
        setSettingsLoading(false);
      }
    };

    load();
  }, [activeTab, settingsShopId, role]);

  const updateSettingsField = (key: keyof UpdateShopProfileRequest, value: string) => {
    setSettingsForm((prev) => ({ ...prev, [key]: value }));
  };

  const saveShopProfile = async () => {
    if (!settingsShopId) return;
    setSettingsSaving(true);
    try {
      const trimmed = (v?: string) => (v ?? '').trim();

      const payload: UpdateShopProfileRequest = {};
      const assignIfNonEmpty = (k: keyof UpdateShopProfileRequest) => {
        const v = trimmed(String(settingsForm[k] ?? ''));
        if (v) (payload as any)[k] = v;
      };

      assignIfNonEmpty('shopName');
      assignIfNonEmpty('description');
      assignIfNonEmpty('logoUrl');
      assignIfNonEmpty('address');
      assignIfNonEmpty('phone');
      assignIfNonEmpty('warehouseAddress');
      assignIfNonEmpty('warehouseCity');
      assignIfNonEmpty('warehouseDistrict');
      assignIfNonEmpty('warehouseWard');
      assignIfNonEmpty('warehousePhone');

      if (Object.keys(payload).length === 0) {
        toast.error('Nothing to update.');
        return;
      }

      await apiPut('shop', `/api/vendor/shops/${settingsShopId}/profile`, payload);
      toast.success('Shop profile updated successfully!');

      // Refresh view
      const shop = await apiGet<Shop>('shop', `/api/shops/${settingsShopId}`);
      setSettingsShop(shop);
      setSettingsForm({
        shopName: shop.shopName || '',
        description: shop.description || '',
        logoUrl: shop.logoUrl || '',
        address: shop.address || '',
        phone: shop.phone || '',
        warehouseAddress: shop.warehouseAddress || '',
        warehouseCity: shop.warehouseCity || '',
        warehouseDistrict: shop.warehouseDistrict || '',
        warehouseWard: shop.warehouseWard || '',
        warehousePhone: shop.warehousePhone || '',
      });
    } catch (e: any) {
      if (!handleSessionExpired(e)) {
        toast.error(getUserFacingErrorMessage(e, { defaultMessage: 'Failed to update shop profile.' }));
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 font-sans relative">
      <div className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Internal Portal</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <Sidebar
          role={role!}
          userId={userId}
          activeTab={activeTab}
          productCount={myProducts.length}
          approvalCount={approvalQueue.length}
          onTabChange={handleTabChange}
        />

        <div className="w-full lg:w-3/4 space-y-6 animate-in fade-in duration-300">

          {activeTab === 'dashboard' && <DashboardTab role={role!} userId={userId} />}

          {activeTab === 'products' && role !== 'SHIPPER' && (
            showProductForm ? (
              <ProductForm
                isEditing={!!editingId}
                saving={saving}
                formData={productForm}
                shopSearchQuery={shopSearchQuery}
                shopSearchResults={shopSearchResults}
                isSearchingShop={isSearchingShop}
                showShopSearch={role === 'VENDOR'}
                onFormChange={setProductForm}
                onShopSearch={searchShops}
                onShopSelect={(shop) => { setProductForm((f) => ({ ...f, targetShopId: shop.shopId })); setShopSearchQuery(shop.shopName); setShopSearchResults([]); }}
                onImageChange={handleImageChange}
                onSubmit={handleProductSubmit}
                onBack={() => setShowProductForm(false)}
              />
            ) : (
              <>
                {role === 'VENDOR' && vendorShops.length > 1 && (
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4">
                    <span className="text-sm font-bold text-slate-500 shrink-0">Viewing shop:</span>
                    <select
                      value={vendorShopId}
                      onChange={e => {
                        const id = e.target.value;
                        setVendorShopId(id);
                        fetchVendorProducts(id);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {vendorShops.map((shop) => (
                        <option key={shop.shopId} value={shop.shopId}>
                          {shop.shopName || `Shop #${shop.shopId}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <ProductsTab
                  role={role!}
                  products={myProducts}
                  onAddProduct={() => { setEditingId(null); setProductForm(DEFAULT_FORM); setShopSearchQuery(''); setShowProductForm(true); }}
                  onEditProduct={openEditForm}
                  onDeleteProduct={(id) => setDeleteModal({ isOpen: true, productId: id })}
                  onSetDiscount={(p) => setDiscountModal({ isOpen: true, productId: p.productId, productName: p.name, discount: p.discountPercentage || 0 })}
                />
              </>
            )
          )}

          {activeTab === 'approval' && role === 'MANAGER' && (
            <ApprovalTab
              queue={approvalQueue}
              onReview={(product) => setDetailModal({ isOpen: true, product })}
            />
          )}

          {activeTab === 'disputes' && role !== 'SHIPPER' && (
            <DisputesTab userId={userId} shopId={role === 'VENDOR' ? vendorShopId : shopData.shopId} />
          )}

          {activeTab === 'settings' && role !== 'SHIPPER' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[600px] animate-in fade-in">
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Shop Profile</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Configure shop contact info and warehouse pickup address for shippers.
                  </p>
                </div>
              </div>

              {role === 'VENDOR' && vendorShops.length > 1 && (
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 mb-6">
                  <span className="text-sm font-bold text-slate-500 shrink-0">Editing shop:</span>
                  <select
                    value={vendorShopId}
                    onChange={(e) => setVendorShopId(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-800 font-bold rounded-xl text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {vendorShops.map((s) => (
                      <option key={s.shopId} value={s.shopId}>
                        {s.shopName || `Shop #${s.shopId}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {settingsLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-cyan-600 rounded-full animate-spin" />
                  Loading shop profile...
                </div>
              ) : !settingsShopId ? (
                <div className="text-slate-500">No shop selected.</div>
              ) : (
                <div className="max-w-3xl space-y-6">
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Note</p>
                    <p className="text-sm text-slate-600">
                      If warehouse address is left blank, backend will automatically fallback to the shop address/phone.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-slate-200 bg-white">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Shop Contact</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Shop Name</label>
                        <input
                          value={settingsForm.shopName || ''}
                          onChange={(e) => updateSettingsField('shopName', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.shopName || 'Shop name'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                        <input
                          value={settingsForm.phone || ''}
                          onChange={(e) => updateSettingsField('phone', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.phone || 'Shop phone'}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <input
                          value={settingsForm.address || ''}
                          onChange={(e) => updateSettingsField('address', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.address || 'Shop address'}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Logo URL</label>
                        <input
                          value={settingsForm.logoUrl || ''}
                          onChange={(e) => updateSettingsField('logoUrl', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.logoUrl || 'https://...'}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                        <textarea
                          rows={3}
                          value={settingsForm.description || ''}
                          onChange={(e) => updateSettingsField('description', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.description || 'Shop description'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl border border-slate-200 bg-white">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Warehouse Pickup (for Shipper)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Warehouse Address</label>
                        <input
                          value={settingsForm.warehouseAddress || ''}
                          onChange={(e) => updateSettingsField('warehouseAddress', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.warehouseAddress || 'If empty, will fallback to shop address'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                        <input
                          value={settingsForm.warehouseCity || ''}
                          onChange={(e) => updateSettingsField('warehouseCity', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.warehouseCity || 'City'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">District</label>
                        <input
                          value={settingsForm.warehouseDistrict || ''}
                          onChange={(e) => updateSettingsField('warehouseDistrict', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.warehouseDistrict || 'District'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ward</label>
                        <input
                          value={settingsForm.warehouseWard || ''}
                          onChange={(e) => updateSettingsField('warehouseWard', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.warehouseWard || 'Ward'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Warehouse Phone</label>
                        <input
                          value={settingsForm.warehousePhone || ''}
                          onChange={(e) => updateSettingsField('warehousePhone', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-slate-50 focus:bg-white text-sm"
                          placeholder={settingsShop?.warehousePhone || 'Warehouse phone'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={saveShopProfile}
                      disabled={settingsSaving}
                      className="px-7 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                      {settingsSaving && <span className="w-4 h-4 border-2 border-white/70 border-t-white rounded-full animate-spin" />}
                      {settingsSaving ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {detailModal.isOpen && (
        <ProductReviewModal
          product={detailModal.product}
          saving={saving}
          onClose={() => setDetailModal({ isOpen: false, product: null })}
          onApprove={handleApproveProduct}
          onReject={(id, name) => setRejectModal({ isOpen: true, productId: id, productName: name, reason: '' })}
        />
      )}

      <DiscountModal
        isOpen={discountModal.isOpen}
        productName={discountModal.productName}
        discount={discountModal.discount}
        saving={saving}
        onClose={() => setDiscountModal({ ...discountModal, isOpen: false })}
        onDiscountChange={(v) => setDiscountModal((d) => ({ ...d, discount: v }))}
        onSave={handleSaveDiscount}
      />

      <RejectModal
        isOpen={rejectModal.isOpen}
        productName={rejectModal.productName}
        reason={rejectModal.reason}
        saving={saving}
        onClose={() => setRejectModal({ ...rejectModal, isOpen: false })}
        onReasonChange={(v) => setRejectModal((r) => ({ ...r, reason: v }))}
        onConfirm={handleSaveReject}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        saving={saving}
        onClose={() => setDeleteModal({ isOpen: false, productId: '' })}
        onConfirm={executeDeleteProduct}
      />
    </div>
  );
}