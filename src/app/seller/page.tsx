// ===== src/app/seller/page.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { getAuth } from '@/lib/auth';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Sidebar from '@/components/seller/Sidebar';
import DashboardTab from '@/components/seller/DashboardTab';
import ProductsTab from '@/components/seller/ProductsTab';
import ProductForm, { ProductFormData } from '@/components/seller/ProductForm';
import ApprovalTab from '@/components/seller/ApprovalTab';
import DisputesTab from '@/components/seller/DisputesTab';
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

  // ─── Auth / role ────────────────────────────────────────────────────────────
  const [loading, setLoading]   = useState(true);
  const [role, setRole]         = useState<Role | null>(null);
  const [userId, setUserId]     = useState('');

  // ─── Shop / tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [shopData, setShopData]       = useState({ shopId: '', shopName: '', address: '', description: '', logoUrl: '', status: '' });
  const [saving, setSaving]           = useState(false);
  const [myProducts, setMyProducts]   = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  // shopId hiện tại cho VENDOR (lấy từ my-assigned-shops, không hardcode)
  const [vendorShopId, setVendorShopId] = useState<string>('');
  const [vendorShops, setVendorShops]   = useState<{ shopId: string; shopName: string }[]>([]);

  // ─── Product form ────────────────────────────────────────────────────────────
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [productForm, setProductForm]         = useState<ProductFormData>(DEFAULT_FORM);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSearchResults, setShopSearchResults] = useState<any[]>([]);
  const [isSearchingShop, setIsSearchingShop] = useState(false);

  // ─── Modals ──────────────────────────────────────────────────────────────────
  const [discountModal, setDiscountModal] = useState({ isOpen: false, productId: '', productName: '', discount: 0 });
  const [rejectModal, setRejectModal]     = useState({ isOpen: false, productId: '', productName: '', reason: '' });
  const [deleteModal, setDeleteModal]     = useState({ isOpen: false, productId: '' });
  const [detailModal, setDetailModal]     = useState({ isOpen: false, product: null as any });

  // ─── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { token, userId: uid } = getAuth();
    if (!token || !uid) { toast.error('Please log in!'); router.push('/login'); return; }
    setUserId(uid);

    if (uid.startsWith('SHOP_MNG')) {
      setRole('MANAGER');
      fetchShopData(uid, token, 'MANAGER');
    } else if (uid.startsWith('VEND')) {
      setRole('VENDOR');
      // Fetch shops được assign cho vendor, lấy shop đầu tiên để load products
      fetch('http://localhost:8082/api/shops/my-assigned-shops', {
        headers: { Authorization: `Bearer ${token}`, userId: uid },
      })
        .then(r => r.ok ? r.json() : [])
        .then((shops: any[]) => {
          if (shops?.length > 0) {
            const firstShopId = shops[0].shopId;
            setVendorShops(shops);
            setVendorShopId(firstShopId);
            fetchVendorProducts(firstShopId, token);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (uid.startsWith('SHIPPER')) {
      setRole('SHIPPER');
      setLoading(false);
    } else {
      toast.error('Access Denied. This dashboard is for internal staff only.');
      router.push('/');
    }
  }, [router]);

  // ─── Fetch helpers ───────────────────────────────────────────────────────────
  const fetchShopData = async (ownerId: string, token: string, r: string) => {
    try {
      const res = await fetch(`http://localhost:8082/api/shops/owner/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const shops = await res.json();
        if (shops?.length > 0) {
          setShopData(shops[0]);
          if (r === 'MANAGER') {
            fetchApprovalQueue(token, shops[0].shopId);
            fetchManagerProducts(shops[0].shopId, token);
          }
        }
      }
    } catch {} finally { setLoading(false); }
  };

  const fetchApprovalQueue = async (token: string, shopId: string) => {
    try {
      const res = await fetch('http://localhost:8083/api/manager/products/queue', {
        headers: { Authorization: `Bearer ${token}`, 'SHOP-ID': shopId },
      });
      if (res.ok) setApprovalQueue(await res.json());
    } catch {}
  };

  const fetchManagerProducts = async (shopId: string, token: string) => {
    try {
      const res = await fetch('http://localhost:8083/api/manager/products', {
        headers: { Authorization: `Bearer ${token}`, 'SHOP-ID': shopId },
      });
      if (res.ok) setMyProducts(await res.json());
    } catch {}
  };

  const fetchVendorProducts = async (shopId: string, token: string) => {
    try {
      const res = await fetch('http://localhost:8083/api/vendor/products', {
        headers: { Authorization: `Bearer ${token}`, 'X-Shop-Id': shopId },
      });
      if (res.ok) setMyProducts(await res.json());
    } catch {}
  };

  const searchShops = async (keyword: string) => {
    setShopSearchQuery(keyword);
    if (!keyword.trim()) { setShopSearchResults([]); return; }
    setIsSearchingShop(true);
    const { token } = getAuth();
    try {
      const res = await fetch(`http://localhost:8082/api/shops/search?keyword=${encodeURIComponent(keyword)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setShopSearchResults(await res.json());
    } catch {} finally { setIsSearchingShop(false); }
  };

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleApproveProduct = async (product: any) => {
    setSaving(true);
    const { token } = getAuth();
    try {
      const res = await fetch(`http://localhost:8083/api/manager/products/${product.productId}/review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId: userId, approved: true, comments: 'Approved', discountPercentage: product.discountPercentage || 0 }),
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success('Product Approved successfully!');
      fetchApprovalQueue(token!, shopData.shopId);
      fetchManagerProducts(shopData.shopId, token!);
      setDetailModal({ isOpen: false, product: null });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleSaveReject = async () => {
    if (!rejectModal.reason.trim()) { toast.error('Please provide a reason for rejection'); return; }
    setSaving(true);
    const { token } = getAuth();
    try {
      const res = await fetch(`http://localhost:8083/api/manager/products/${rejectModal.productId}/review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId: userId, approved: false, comments: rejectModal.reason, discountPercentage: 0 }),
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success('Product Rejected!');
      fetchApprovalQueue(token!, shopData.shopId);
      fetchManagerProducts(shopData.shopId, token!);
      setRejectModal({ ...rejectModal, isOpen: false, reason: '' });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleSaveDiscount = async () => {
    setSaving(true);
    const { token } = getAuth();
    try {
      const res = await fetch(
        `http://localhost:8083/api/manager/products/${discountModal.productId}/discount?percentage=${discountModal.discount}&managerId=${userId}`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'SHOP-ID': shopData.shopId } }
      );
      if (!res.ok) throw new Error('Failed to update discount');
      toast.success('Discount updated successfully!');
      fetchManagerProducts(shopData.shopId, token!);
      fetchApprovalQueue(token!, shopData.shopId);
      setDiscountModal({ ...discountModal, isOpen: false });
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'VENDOR') { toast.error('Only Vendor can update products!'); return; }
    if (!productForm.targetShopId) { toast.error('Please select a partner shop!'); return; }
    setSaving(true);
    const { token } = getAuth();
    const url = editingId ? `http://localhost:8083/api/vendor/products/${editingId}` : 'http://localhost:8083/api/vendor/products';
    try {
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Shop-Id': productForm.targetShopId },
        body: JSON.stringify({ ...productForm, shopId: productForm.targetShopId }),
      });
      if (!res.ok) throw new Error('Failed to save product!');
      toast.success(editingId ? 'Product updated successfully!' : 'Product submitted successfully!');
      setShowProductForm(false);
      fetchVendorProducts(productForm.targetShopId, token!);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const executeDeleteProduct = async () => {
    setSaving(true);
    const { token } = getAuth();
    try {
      const res = await fetch(`http://localhost:8083/api/${role?.toLowerCase()}/products/${deleteModal.productId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Product deleted successfully!');
      if (role === 'MANAGER') fetchManagerProducts(shopData.shopId, token!);
      else fetchVendorProducts(productForm.targetShopId || vendorShopId, token!);
      setDeleteModal({ isOpen: false, productId: '' });
    } catch (e: any) { toast.error(e.message); }
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

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 font-sans relative">
      {/* Breadcrumb */}
      <div className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Internal Portal</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar */}
        <Sidebar
          role={role!}
          userId={userId}
          activeTab={activeTab}
          productCount={myProducts.length}
          approvalCount={approvalQueue.length}
          onTabChange={handleTabChange}
        />

        {/* Main content */}
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
                {/* Shop selector cho VENDOR nếu được assign nhiều shop */}
                {role === 'VENDOR' && vendorShops.length > 1 && (
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4">
                    <span className="text-sm font-bold text-slate-500 shrink-0">Viewing shop:</span>
                    <select
                      value={vendorShopId}
                      onChange={e => {
                        const id = e.target.value;
                        setVendorShopId(id);
                        const { token } = getAuth();
                        if (token) fetchVendorProducts(id, token);
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      {vendorShops.map(s => (
                        <option key={s.shopId} value={s.shopId}>
                          {s.shopName || `Shop #${s.shopId}`}
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
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
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