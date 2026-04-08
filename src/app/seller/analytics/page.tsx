'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  TrendingUp, DollarSign, Package, Calendar, Loader2, 
  ChevronLeft, BarChart3, ShoppingBag, Store
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

import { logout } from '@/lib/auth';
import { apiGet, getUserFacingErrorMessage, isApiError } from '@/lib/api';
import { loadManagedShops } from '@/lib/shop';

export default function UnifiedAnalyticsDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string>(''); 
  const [shops, setShops] = useState<any[]>([]); 
  const [userRole, setUserRole] = useState<string>(''); // Current role
  
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; 
  };

  const today = new Date();
  const priorDate = new Date();
  priorDate.setDate(today.getDate() - 30); 
  
  const [startDate, setStartDate] = useState(getLocalDateString(priorDate));
  const [endDate, setEndDate] = useState(getLocalDateString(today));

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUserId = localStorage.getItem('userId'); 
    const storedRole = localStorage.getItem('role') || '';
    if (!token || !storedUserId) {
      router.push('/login');
      return;
    }

    setUserRole(storedRole);

    if (storedRole.startsWith('SHOP_MNG')) {
      fetchManagerShops(storedUserId, storedRole);
    } else if (storedRole.startsWith('VEND')) {
      fetchVendorShops(storedUserId, storedRole);
    } else {
      toast.error('Unauthorized access. Invalid user role.');

    }
  }, [router]);

  // Fetch shops for MANAGER
  const fetchManagerShops = async (userId: string, role: string) => {
    try {
      const data = await loadManagedShops(userId, role);
      handleShopList(data, role, "You don't own any shops.");
    } catch (err) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        logout();
        toast.error('Your session has expired. Please sign in again.');
        router.push('/login');
        return;
      }
      console.error(err);
      setLoading(false);
    }
  };

  // Fetch shops for VENDOR
  const fetchVendorShops = async (userId: string, role: string) => {
    try {
      const data = await loadManagedShops(userId, role);
      handleShopList(data, role, 'You are not assigned to manage any shop.');
    } catch (err) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        logout();
        toast.error('Your session has expired. Please sign in again.');
        router.push('/login');
        return;
      }
      console.error(err);
      setLoading(false);
    }
  };

  // Shared handler after retrieving shop list
  const handleShopList = async (data: any[] | undefined, role: string, emptyMsg: string) => {
    if (data && data.length > 0) {
      setShops(data);
      const actualShopId = data[0].shopId;
      setShopId(actualShopId);
      fetchShopStats(actualShopId, startDate, endDate, role);
    } else {
      setLoading(false);
      toast.error(emptyMsg);
    }
  };

  const fetchShopStats = async (sId: string, start: string, end: string, role: string) => {
    setLoading(true);
    try {
      // Determine stats base URL by role
      const isManager = role.startsWith('SHOP_MNG');
      const statsBasePath = isManager
        ? `/api/manager/stats/shop/${sId}`
        : `/api/vendor/stats/${sId}`;

      const revenue = await apiGet<any>(
        'stats',
        `${statsBasePath}/revenue?startDate=${start}&endDate=${end}`,
        { withUserId: false }
      );

      if (!Array.isArray(revenue)) {
        setRevenueData([
          {
            date: 'Total Period',
            totalRevenue: revenue?.totalRevenue || revenue?.revenue || 0,
            totalOrders: revenue?.totalOrders || revenue?.orders || 0,
            totalItemsSold: revenue?.totalItemsSold || 0,
          },
        ]);
      } else {
        setRevenueData(
          revenue.map((item: any) => ({
            date: item.date,
            totalRevenue: item.totalRevenue || item.revenue || 0,
            totalOrders: item.totalOrders || item.orders || 0,
            totalItemsSold: item.totalItemsSold || 0,
          }))
        );
      }

      const top = await apiGet<any[]>(
        'stats',
        `${statsBasePath}/top-products`,
        { withUserId: false }
      );
      setTopProducts(top ?? []);
      
    } catch (err) {
      console.error("Error fetching stats:", err);
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        logout();
        toast.error('Your session has expired. Please sign in again.');
        router.push('/login');
        return;
      }
      toast.error(
        getUserFacingErrorMessage(err, {
          defaultMessage: 'Failed to load analytics data.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    const token = localStorage.getItem('accessToken');
    if (token && shopId) {
      fetchShopStats(shopId, startDate, endDate, userRole);
    }
  };

  const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newShopId = e.target.value;
    setShopId(newShopId);
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchShopStats(newShopId, startDate, endDate, userRole);
    }
  };

  const totalRevenue = revenueData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
  const totalOrders = revenueData.reduce((sum, item) => sum + (item.totalOrders || 0), 0);
  const totalItems = revenueData.reduce((sum, item) => sum + (item.totalItemsSold || 0), 0);

  if (loading && revenueData.length === 0 && topProducts.length === 0 && shops.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  // Customize back link based on role
  const backLinkUrl = userRole.includes('MANAGER') ? '/manager/dashboard' : '/vendor/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <div className="bg-slate-900 border-b border-slate-800 pt-8 pb-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <Link href={backLinkUrl} className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-cyan-400 mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Workspace
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-cyan-400" /> 
                {userRole.includes('MANAGER') ? 'Shop Analytics' : 'Vendor Analytics'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Business performance of your {userRole.includes('MANAGER') ? 'owned' : 'assigned'} shops.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 bg-slate-800 p-1.5 rounded-xl mt-4 md:mt-0">

              {shops.length > 0 && (
                <div className="flex items-center bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                  <Store className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
                  <select 
                    value={shopId} 
                    onChange={handleShopChange}
                    className="bg-transparent text-sm text-white font-medium outline-none cursor-pointer w-[160px] appearance-none"
                  >
                    {shops.map((shop) => (
                      <option key={shop.shopId} value={shop.shopId} className="bg-slate-800 text-white">
                        {shop.shopName || shop.name || `Shop #${shop.shopId.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm text-white outline-none cursor-pointer" />
              </div>
              <span className="text-slate-500 font-bold">-</span>
              <div className="flex items-center bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm text-white outline-none cursor-pointer" />
              </div>
              <button onClick={handleDateFilter} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-lg transition-colors ml-1">
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
              <DollarSign className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</p>
              <h3 className="text-3xl font-black text-slate-900">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue)}
              </h3>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
              <ShoppingBag className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Orders</p>
              <h3 className="text-3xl font-black text-slate-900">{totalOrders}</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0">
              <Package className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Items Sold</p>
              <h3 className="text-3xl font-black text-slate-900">{totalItems}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-black text-slate-900">Revenue Chart</h3>
          </div>
          <div className="h-[400px] w-full">
            {revenueData.length === 0 && !loading ? (
              <div className="h-full w-full flex items-center justify-center text-slate-400 font-medium">No data available for this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="totalRevenue" stroke="#0891b2" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-black text-slate-900">Top Selling Products</h3>
          </div>
          
          {topProducts.length === 0 && !loading ? (
            <div className="py-20 text-center text-slate-400 font-medium">No products available for this period.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {topProducts.map((product, idx) => (
                  <div key={product.productId} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{product.productName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: {product.productId}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-cyan-600">{product.totalSold} sold</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-[350px] hidden lg:block">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts.slice(0, 5)} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="productName" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(value) => value && value.length > 12 ? `${value.substring(0, 12)}...` : value} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`${value} items`, 'Sold']} />
                    <Bar dataKey="totalSold" fill="#0891b2" radius={[6, 6, 0, 0]} barSize={40} label={{ position: 'top', fill: '#0f172a', fontSize: 12, fontWeight: 'bold' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}