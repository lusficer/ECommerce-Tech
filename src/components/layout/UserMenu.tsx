'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, Store, LogOut, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuth, inferRoleFromUserId, logout } from '@/lib/auth';
import { apiGet } from '@/lib/api';

function canAccessSellerPortal(userId: string, role: string): boolean {
  const normalizedRole = (role || '').toUpperCase();
  if (
    ['VENDOR', 'SHOP_MANAGER', 'SHIPPER', 'ADMIN'].includes(
      normalizedRole
    )
  ) {
    return true;
  }

  // Fallback: infer from ID prefix when role is missing.
  return (
    userId.startsWith('VEND') ||
    userId.startsWith('SHOP_MNG') ||
    userId.startsWith('SHIPPER')
  );
}

function isAdminRole(userId: string, role: string): boolean {
  const normalizedRole = (role || '').trim().toUpperCase();
  return normalizedRole === 'ADMIN' || inferRoleFromUserId(userId) === 'ADMIN';
}

export default function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted]   = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName]     = useState('User');
  const [isManager, setIsManager]   = useState(false);
  const [isAdmin, setIsAdmin]       = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let cancelled = false;

    const refresh = async () => {
      const { token, userId } = getAuth();
      const loggedIn = Boolean(token && userId);

      if (!loggedIn) {
        if (cancelled) return;
        setIsLoggedIn(false);
        setIsManager(false);
        setIsAdmin(false);
        setUserName('User');
        return;
      }

      if (cancelled) return;
      setIsLoggedIn(true);

      // Start with cached values for snappy UI.
      const cachedName = localStorage.getItem('userName') || 'User';
      setUserName(cachedName);

      const cachedRole = localStorage.getItem('role') || '';
      setIsManager(canAccessSellerPortal(userId, cachedRole));
      setIsAdmin(isAdminRole(userId, cachedRole));

      // Then fetch the latest account status.
      try {
        const data = await apiGet<any>('user', `/api/account/status/${userId}`, {
          withUserId: false,
        });
        if (cancelled) return;

        const name = data?.profile?.name;
        if (typeof name === 'string' && name.trim()) {
          setUserName(name);
          localStorage.setItem('userName', name);
        }

        const resolvedRole = (data?.role || data?.profile?.role || '') as string;
        const inferredRole = inferRoleFromUserId(userId);
        const finalRole = inferredRole || resolvedRole || cachedRole;
        if (finalRole) {
          localStorage.setItem('role', finalRole);
        }
        setIsManager(canAccessSellerPortal(userId, finalRole));
        setIsAdmin(isAdminRole(userId, finalRole));
      } catch {
        // Silent – fallback to cached role/name.
      }
    };

    refresh();

    const onAuthUpdated = () => {
      refresh();
    };
    window.addEventListener('authUpdated', onAuthUpdated);
    window.addEventListener('storage', onAuthUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener('authUpdated', onAuthUpdated);
      window.removeEventListener('storage', onAuthUpdated);
    };
  }, [isMounted, pathname]);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUserName('User');
    toast.success('Logged out successfully!');
    router.push('/login');
  };

  if (!isMounted) {
    return (
      <div className="flex items-center gap-2 min-w-[140px]">
        <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3 min-w-[140px]">
        <Link href="/profile" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-all">
          <div className="text-cyan-600 p-1.5 bg-cyan-50 rounded-full">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-0.5">Hello,</span>
            <span className="text-sm font-bold text-slate-900 leading-none truncate max-w-[70px]">{userName}</span>
          </div>
        </Link>

        {isAdmin && (
          <>
            <div className="h-6 w-px bg-slate-200 hidden md:block mx-1" />
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-sm"
            >
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Admin</span>
            </Link>
          </>
        )}

        {isManager && !isAdmin && (
          <>
            <div className="h-6 w-px bg-slate-200 hidden md:block mx-1" />
            <Link
              href="/seller"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Store className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Seller</span>
            </Link>
          </>
        )}

        <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
          <LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="text-slate-600 p-1.5 bg-slate-100 rounded-full">
        <User className="w-5 h-5" />
      </div>
      <div className="hidden lg:flex flex-col items-start">
        <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
          <Link href="/login" className="hover:text-cyan-600 transition-colors">Log In</Link>
          <span className="text-slate-300 font-normal">/</span>
          <Link href="/register" className="hover:text-cyan-600 transition-colors">Register</Link>
        </div>
      </div>
    </div>
  );
}
