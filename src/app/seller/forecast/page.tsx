'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle,
  RefreshCcw, Play, Loader2, ChevronLeft, Info,
  ArrowUp, ArrowDown, Package, BarChart3
} from 'lucide-react';
import { getAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { apiGet, apiPost, getUserFacingErrorMessage } from '@/lib/api';
import { loadManagedShops } from '@/lib/shop';

interface ForecastResult {
  productId: string;
  productName: string;
  trendSlope: number | null;
  predictedNextDay: number | null;
  trendLabel: string | null;
  aiRecommendation: string | null;
  oldSafetyStock: number | null;
  newSafetyStock: number | null;
  status: string; // STABLE | UPDATE_NEEDED | UPDATED | NO_DATA
}
function getTrendConfig(label: string | null) {
  if (!label) return { icon: Minus, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600' };
  if (label.includes('HIGH VELOCITY'))
    return { icon: TrendingUp, color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700' };
  if (label.includes('POSITIVE'))
    return { icon: TrendingUp, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' };
  if (label.includes('STABLE'))
    return { icon: Minus,      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' };
  if (label.includes('DECLINING'))
    return { icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' };
  return { icon: Minus, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600' };
}

function getStatusPill(status: string) {
  switch (status) {
    case 'UPDATED':      return 'bg-green-100 text-green-700 border-green-200';
    case 'UPDATE_NEEDED': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'NO_DATA':      return 'bg-slate-100 text-slate-500 border-slate-200';
    default:             return 'bg-blue-100 text-blue-700 border-blue-200';
  }
}
function SummaryCards({ results }: { results: ForecastResult[] }) {
  const surging  = results.filter(r => r.trendLabel?.includes('HIGH VELOCITY')).length;
  const growing  = results.filter(r => r.trendLabel?.includes('POSITIVE')).length;
  const stable   = results.filter(r => r.trendLabel?.includes('STABLE')).length;
  const cooling  = results.filter(r => r.trendLabel?.includes('DECLINING')).length;
  const noData   = results.filter(r => r.status === 'NO_DATA').length;
  const needUpd  = results.filter(r => r.status === 'UPDATE_NEEDED').length;

  const cards = [
    { label: 'Total Products', value: results.length, icon: Package, color: 'text-slate-700', bg: 'bg-slate-50' },
    { label: 'Surging Demand', value: surging,  icon: TrendingUp,   color: 'text-red-600',    bg: 'bg-red-50' },
    { label: 'Growing',        value: growing,  icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Stable',         value: stable,   icon: Minus,        color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Declining',      value: cooling,  icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Needs Update',   value: needUpd,  icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={`${c.bg} rounded-2xl p-4 border border-white shadow-sm flex flex-col gap-2`}>
            <Icon className={`w-5 h-5 ${c.color}`} />
            <span className="text-2xl font-black text-slate-900">{c.value}</span>
            <span className="text-xs font-bold text-slate-500">{c.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ForecastCard({ item }: { item: ForecastResult }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = getTrendConfig(item.trendLabel);
  const Icon = cfg.icon;
  const slopeChanged = item.oldSafetyStock !== item.newSafetyStock;

  if (item.status === 'NO_DATA') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 opacity-60">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-700 text-sm truncate">{item.productName}</p>
          <p className="text-xs text-slate-400 mt-0.5">No sales data in the last 30 days</p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-1 rounded-full border bg-slate-100 text-slate-500 border-slate-200 uppercase">
          NO DATA
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border ${cfg.border} shadow-sm overflow-hidden transition-all`}>
      <div
        className="p-5 flex items-start gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${cfg.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-bold text-slate-900 text-sm truncate">{item.productName}</p>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getStatusPill(item.status)} uppercase shrink-0`}>
              {item.status.replace('_', ' ')}
            </span>
          </div>
          <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.badge} uppercase tracking-wide`}>
            {item.trendLabel ?? 'UNKNOWN'}
          </span>
        </div>

        <div className="shrink-0 text-right hidden sm:block">
          <p className="text-xs font-bold text-slate-400 mb-1">Slope</p>
          <p className={`text-lg font-black ${(item.trendSlope ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {(item.trendSlope ?? 0) >= 0 ? '+' : ''}{(item.trendSlope ?? 0).toFixed(2)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-bold text-slate-400 mb-1">Safety Stock</p>
          <div className="flex items-center gap-1 justify-end">
            <span className="text-sm font-bold text-slate-500 line-through">{item.oldSafetyStock}</span>
            {slopeChanged ? <ArrowUp className="w-3.5 h-3.5 text-orange-500" /> : null}
            <span className={`text-lg font-black ${slopeChanged ? 'text-orange-600' : 'text-slate-700'}`}>
              {item.newSafetyStock}
            </span>
          </div>
        </div>
      </div>

      {expanded && item.aiRecommendation && (
        <div className={`px-5 pb-5 border-t ${cfg.border}`}>
          <div className={`mt-4 rounded-xl p-4 ${cfg.bg} flex gap-3`}>
            <Brain className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.color}`} />
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Recommendation</p>
              <p className="text-sm text-slate-700 leading-relaxed">{item.aiRecommendation}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-400 font-bold mb-1">Predicted Next Day Sales</p>
              <p className="font-black text-slate-900">{(item.predictedNextDay ?? 0).toFixed(1)} units</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-400 font-bold mb-1">Trend Slope</p>
              <p className={`font-black ${(item.trendSlope ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {(item.trendSlope ?? 0) >= 0 ? '+' : ''}{(item.trendSlope ?? 0).toFixed(4)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs text-slate-400 font-bold mb-1">Safety Stock Delta</p>
              <p className={`font-black ${(item.newSafetyStock ?? 0) > (item.oldSafetyStock ?? 0) ? 'text-orange-600' : (item.newSafetyStock ?? 0) < (item.oldSafetyStock ?? 0) ? 'text-green-600' : 'text-slate-500'}`}>
                {(item.newSafetyStock ?? 0) > (item.oldSafetyStock ?? 0)
                  ? `+${(item.newSafetyStock ?? 0) - (item.oldSafetyStock ?? 0)}`
                  : (item.newSafetyStock ?? 0) - (item.oldSafetyStock ?? 0)} units
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryForecastPage() {
  const router = useRouter();
  const [loading, setLoading]         = useState(true);
  const [applying, setApplying]       = useState(false);
  const [results, setResults]         = useState<ForecastResult[]>([]);
  const [filterLabel, setFilterLabel] = useState<string>('ALL');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [shopId, setShopId]           = useState<string | null>(null);
  const [shops, setShops]             = useState<{ shopId: string; shopName?: string; name?: string }[]>([]);

  // Fetch shops list — same as analytics page
  useEffect(() => {
    const token  = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const role   = localStorage.getItem('role') || '';

    if (!token || !userId) { router.push('/login'); return; }

    const fetchShops = async () => {
      try {
        const list = await loadManagedShops(userId, role);
        if (list.length > 0) {
          setShops(list);
          setShopId(list[0].shopId);
        }
      } catch (err) {
        toast.error(
          getUserFacingErrorMessage(err, {
            defaultMessage: 'Failed to load shops.',
          })
        );
      }
    };
    fetchShops();
  }, []);

  // Fetch forecast when shopId is available
  useEffect(() => {
    if (shopId !== null) fetchPreview();
  }, [shopId]);

  const fetchPreview = async () => {
    setLoading(true);
    const { token } = getAuth();
    if (!token) { router.push('/login'); return; }

    try {
      const path = shopId
        ? `/api/internal/forecast/preview?shopId=${shopId}`
        : '/api/internal/forecast/preview';
      const data = await apiGet<ForecastResult[]>('inventory', path);
      setResults(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      toast.error(
        getUserFacingErrorMessage(err, {
          defaultMessage: 'Failed to load forecast data.',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const applyForecast = async () => {
    setApplying(true);
    const { token } = getAuth();
    try {
      const path = shopId
        ? `/api/internal/forecast/run?shopId=${shopId}`
        : '/api/internal/forecast/run';
      const data = await apiPost<ForecastResult[]>('inventory', path);
      setResults(data);
      setLastUpdated(new Date().toLocaleTimeString());
      const updatedCount = data.filter(r => r.status === 'UPDATED').length;
      toast.success(`Forecast applied! ${updatedCount} products updated.`);
    } catch (err) {
      toast.error(
        getUserFacingErrorMessage(err, {
          defaultMessage: 'Failed to apply forecast.',
        })
      );
    } finally {
      setApplying(false);
    }
  };

  // Filter options
  const FILTER_OPTIONS = [
    { id: 'ALL',          label: 'All' },
    { id: 'HIGH VELOCITY', label: '🔴 Surging' },
    { id: 'POSITIVE',     label: '🟢 Growing' },
    { id: 'STABLE',       label: '🔵 Stable' },
    { id: 'DECLINING',    label: '🟠 Declining' },
    { id: 'NO_DATA',      label: 'No Data' },
  ];

  const filtered = results.filter(r => {
    if (filterLabel === 'ALL') return true;
    if (filterLabel === 'NO_DATA') return r.status === 'NO_DATA';
    return r.trendLabel?.includes(filterLabel) ?? false;
  });

  const needsUpdate = results.filter(r => r.status === 'UPDATE_NEEDED').length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20 font-sans">
      <div className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-wide flex items-center gap-2">
        <Link href="/" className="hover:text-cyan-600 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/seller" className="hover:text-cyan-600 transition-colors">Seller Portal</Link>
        <span>/</span>
        <span className="text-slate-900">Inventory Forecast</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Forecast</h1>
          </div>
          <p className="text-sm text-slate-500 ml-13">
            Linear Regression model trained on 30-day sales history.
            {lastUpdated && <span className="ml-2 text-slate-400">Last updated: {lastUpdated}</span>}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
          {shops.length > 1 && (
            <select
              value={shopId ?? ''}
              onChange={e => setShopId(e.target.value)}
              className="px-3 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {shops.map(s => (
                <option key={s.shopId} value={s.shopId}>
                  {s.shopName || s.name || `Shop #${s.shopId.substring(0, 8)}`}
                </option>
              ))}
            </select>
          )}
          {shops.length === 1 && (
            <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-2.5 rounded-xl">
              {shops[0].shopName || shops[0].name || `Shop #${shops[0].shopId.substring(0, 8)}`}
            </span>
          )}

          {needsUpdate > 0 && (
            <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-xl text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              {needsUpdate} updates pending
            </div>
          )}

          <button
            onClick={fetchPreview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </button>

          <button
            onClick={applyForecast}
            disabled={applying}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md transition-all text-sm disabled:opacity-60"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {applying ? 'Applying...' : 'Apply & Save'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <span className="font-bold">Preview mode:</span> Click <strong>Refresh</strong> to view the latest forecast without saving.
          Click <strong>Apply &amp; Save</strong> to update Safety Stock levels in the database immediately.
          The system also runs this automatically every day at midnight.
        </div>
      </div>

      {results.length > 0 && <SummaryCards results={results} />}

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilterLabel(opt.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
              filterLabel === opt.id
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-400 hover:text-cyan-600'
            }`}
          >
            {opt.label}
            <span className="ml-2 opacity-60 text-xs">
              ({opt.id === 'ALL'
                ? results.length
                : opt.id === 'NO_DATA'
                ? results.filter(r => r.status === 'NO_DATA').length
                : results.filter(r => r.trendLabel?.includes(opt.id)).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-500">No products match this filter</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <ForecastCard key={item.productId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}