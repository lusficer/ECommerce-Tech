'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import AdminReasonModal from '@/components/admin/AdminReasonModal';
import { listAdminShops, setShopStatus } from '@/lib/adminApi';
import { getUserFacingErrorMessage } from '@/lib/api';
import type { AdminShopDTO } from '@/types/admin';

interface ShopPageInfo {
  number: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

interface ShopFilters {
  status: string;
  search: string;
}

interface ShopModalState {
  open: boolean;
  shop: AdminShopDTO | null;
  action: 'activate' | 'deactivate';
}

const PAGE_SIZE = 10;

export default function AdminShopsPage() {
  const [shops, setShops] = useState<AdminShopDTO[]>([]);
  const [pageInfo, setPageInfo] = useState<ShopPageInfo>({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: true,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filters, setFilters] = useState<ShopFilters>({
    status: '',
    search: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [modal, setModal] = useState<ShopModalState>({
    open: false,
    shop: null,
    action: 'deactivate',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setCurrentPage(0);
  }, [filters.status, debouncedSearch]);

  useEffect(() => {
    void fetchShops(currentPage);
  }, [currentPage, filters.status, debouncedSearch]);

  const fetchShops = async (page: number) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await listAdminShops({
        status: filters.status || undefined,
        search: debouncedSearch || undefined,
        page,
        size: PAGE_SIZE,
      });

      setShops(result.content || []);
      setPageInfo({
        number: result.number ?? 0,
        totalPages: result.totalPages ?? 0,
        totalElements: result.totalElements ?? 0,
        first: Boolean(result.first),
        last: Boolean(result.last),
      });
    } catch (error) {
      const message = getUserFacingErrorMessage(error, {
        defaultMessage: 'Failed to load shops.',
      });
      setShops([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const totalPagesForUi = Math.max(1, pageInfo.totalPages || 0);
  const currentPageForUi = Math.min(pageInfo.number + 1, totalPagesForUi);

  const activeFiltersLabel = useMemo(() => {
    const chunks: string[] = [];
    if (filters.status) chunks.push(filters.status);
    if (debouncedSearch) chunks.push(`"${debouncedSearch}"`);
    return chunks.join(' • ');
  }, [filters.status, debouncedSearch]);

  const openDeactivateModal = (shop: AdminShopDTO) => {
    setModal({ open: true, shop, action: 'deactivate' });
  };

  const openActivateModal = (shop: AdminShopDTO) => {
    setModal({ open: true, shop, action: 'activate' });
  };

  const closeModal = () => {
    if (submitting) return;
    setModal({ open: false, shop: null, action: 'deactivate' });
  };

  const handleConfirmAction = async (reason: string) => {
    if (!modal.shop) return;
    setSubmitting(true);
    const isDeactivate = modal.action === 'deactivate';
    try {
      await setShopStatus(
        modal.shop.shopId,
        isDeactivate ? 'DEACTIVATED' : 'ACTIVE',
        isDeactivate ? reason : ''
      );
      toast.success(isDeactivate ? 'Shop deactivated successfully.' : 'Shop activated successfully.');
      closeModal();
      await fetchShops(currentPage);
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(error, {
          defaultMessage: isDeactivate ? 'Failed to deactivate shop.' : 'Failed to activate shop.',
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Shop Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Total shops: <span className="font-bold text-slate-800">{pageInfo.totalElements}</span>
            </p>
            {activeFiltersLabel ? (
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Filters: {activeFiltersLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
            placeholder="Search shop name..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-500 lg:flex-1"
          />

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, status: event.target.value }))
            }
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-cyan-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DEACTIVATED">DEACTIVATED</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-500">No shops found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Shop ID</th>
                  <th className="px-4 py-3">Shop Name</th>
                  <th className="px-4 py-3">Vendor ID</th>
                  <th className="px-4 py-3">Manager ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Deactivated At</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => {
                  const deactivationReason = shop.deactivationReason || '';
                  const truncatedReason =
                    deactivationReason.length > 40
                      ? `${deactivationReason.slice(0, 40)}...`
                      : deactivationReason;
                  const isActive = String(shop.status).toUpperCase() === 'ACTIVE';

                  return (
                    <tr key={shop.shopId} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{shop.shopId}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{shop.shopName}</td>
                      <td className="px-4 py-3 text-slate-700">{shop.vendorId}</td>
                      <td className="px-4 py-3 text-slate-700">{shop.managerId}</td>
                      <td className="px-4 py-3">
                        {isActive ? (
                          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {!isActive ? (
                          <span className="cursor-help" title={deactivationReason}>
                            {truncatedReason || '-'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {shop.deactivatedAt ? new Date(shop.deactivatedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => openDeactivateModal(shop)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openActivateModal(shop)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={loading || pageInfo.first}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <p className="text-sm font-semibold text-slate-600">
            Page {currentPageForUi} of {totalPagesForUi}
          </p>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={loading || pageInfo.last || pageInfo.totalPages <= 1}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <AdminReasonModal
        isOpen={modal.open}
        title={modal.action === 'deactivate' ? 'Deactivate Shop' : 'Activate Shop'}
        description={
          modal.action === 'deactivate'
            ? `Please provide a reason to deactivate ${modal.shop?.shopName || 'this shop'}.`
            : `Are you sure you want to activate ${modal.shop?.shopName || 'this shop'}?`
        }
        confirmLabel={modal.action === 'deactivate' ? 'Deactivate' : 'Activate'}
        confirmVariant={modal.action === 'deactivate' ? 'danger' : 'primary'}
        requireReason={modal.action === 'deactivate'}
        minReasonLength={10}
        onCancel={closeModal}
        onConfirm={handleConfirmAction}
      />

      {submitting ? (
        <div className="fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
          Processing...
        </div>
      ) : null}
    </div>
  );
}

