'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

import AdminReasonModal from '@/components/admin/AdminReasonModal';
import { listAdminUsers, setUserBanStatus } from '@/lib/adminApi';
import { getUserFacingErrorMessage } from '@/lib/api';
import type { AdminUserDTO } from '@/types/admin';

interface UserPageInfo {
  number: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

interface UserFilters {
  role: string;
  isBanned: string;
  search: string;
}

interface UserModalState {
  open: boolean;
  user: AdminUserDTO | null;
  action: 'ban' | 'unban';
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [pageInfo, setPageInfo] = useState<UserPageInfo>({
    number: 0,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: true,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [filters, setFilters] = useState<UserFilters>({
    role: '',
    isBanned: '',
    search: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [modal, setModal] = useState<UserModalState>({
    open: false,
    user: null,
    action: 'ban',
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
  }, [filters.role, filters.isBanned, debouncedSearch]);

  useEffect(() => {
    void fetchUsers(currentPage);
  }, [currentPage, filters.role, filters.isBanned, debouncedSearch]);

  const fetchUsers = async (page: number) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const result = await listAdminUsers({
        role: filters.role || undefined,
        isBanned:
          filters.isBanned === ''
            ? undefined
            : filters.isBanned === 'true',
        search: debouncedSearch || undefined,
        page,
        size: PAGE_SIZE,
      });

      setUsers(result.content || []);
      setPageInfo({
        number: result.number ?? 0,
        totalPages: result.totalPages ?? 0,
        totalElements: result.totalElements ?? 0,
        first: Boolean(result.first),
        last: Boolean(result.last),
      });
    } catch (error) {
      const message = getUserFacingErrorMessage(error, {
        defaultMessage: 'Failed to load users.',
      });
      setUsers([]);
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
    if (filters.role) chunks.push(filters.role);
    if (filters.isBanned === 'true') chunks.push('Banned');
    if (filters.isBanned === 'false') chunks.push('Active');
    if (debouncedSearch) chunks.push(`"${debouncedSearch}"`);
    return chunks.join(' • ');
  }, [filters.role, filters.isBanned, debouncedSearch]);

  const openBanModal = (user: AdminUserDTO) => {
    setModal({ open: true, user, action: 'ban' });
  };

  const openUnbanModal = (user: AdminUserDTO) => {
    setModal({ open: true, user, action: 'unban' });
  };

  const closeModal = () => {
    if (submitting) return;
    setModal({ open: false, user: null, action: 'ban' });
  };

  const handleConfirmAction = async (reason: string) => {
    if (!modal.user) return;
    setSubmitting(true);
    const isBanAction = modal.action === 'ban';
    try {
      await setUserBanStatus(modal.user.userId, isBanAction, reason);
      toast.success(isBanAction ? 'User banned successfully.' : 'User unbanned successfully.');
      closeModal();
      await fetchUsers(currentPage);
    } catch (error) {
      toast.error(
        getUserFacingErrorMessage(error, {
          defaultMessage: isBanAction ? 'Failed to ban user.' : 'Failed to unban user.',
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
            <h1 className="text-2xl font-black text-slate-900">User Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Total users: <span className="font-bold text-slate-800">{pageInfo.totalElements}</span>
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
            placeholder="Search name or email..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-cyan-500 lg:flex-1"
          />

          <select
            value={filters.role}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, role: event.target.value }))
            }
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-cyan-500"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="VENDOR">VENDOR</option>
            <option value="SHOP_MANAGER">SHOP_MANAGER</option>
            <option value="SHIPPER">SHIPPER</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <select
            value={filters.isBanned}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, isBanned: event.target.value }))
            }
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-cyan-500"
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Banned</option>
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
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ban Reason</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const banReason = user.banReason || '';
                  const truncatedReason =
                    banReason.length > 40 ? `${banReason.slice(0, 40)}...` : banReason;
                  return (
                    <tr key={user.userId} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{user.userId}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{user.name}</td>
                      <td className="px-4 py-3 text-slate-700">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isBanned ? (
                          <span className="inline-flex rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.isBanned ? (
                          <span className="cursor-help" title={banReason}>
                            {truncatedReason || '-'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {user.isBanned ? (
                          <button
                            type="button"
                            onClick={() => openUnbanModal(user)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openBanModal(user)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
                          >
                            Ban
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
        title={modal.action === 'ban' ? 'Ban User' : 'Unban User'}
        description={
          modal.action === 'ban'
            ? `Please provide a reason to ban ${modal.user?.name || 'this user'}.`
            : `Are you sure you want to unban ${modal.user?.name || 'this user'}?`
        }
        confirmLabel={modal.action === 'ban' ? 'Ban User' : 'Unban User'}
        confirmVariant={modal.action === 'ban' ? 'danger' : 'primary'}
        requireReason={modal.action === 'ban'}
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

