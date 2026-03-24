// ===== src/components/layout/UserMenu.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Store, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuth, logout } from '@/lib/auth';

export default function UserMenu() {
  const router = useRouter();
  const [isMounted, setIsMounted]   = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName]     = useState('User');
  const [isManager, setIsManager]   = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const { token, userId } = getAuth();
    if (token && userId) {
      setIsLoggedIn(true);
      setIsManager(true); // all logged-in users can access seller centre
      fetchUserName(userId, token);
    }
  }, []);

  const fetchUserName = async (userId: string, token: string) => {
    try {
      const res = await fetch(`http://localhost:8081/api/account/status/${userId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile?.name) setUserName(data.profile.name);
      }
    } catch {}
  };

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

        {isManager && (
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
