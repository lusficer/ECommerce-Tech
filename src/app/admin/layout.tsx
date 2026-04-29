'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Store, Users } from 'lucide-react';
import { getAuth, getStoredRole, inferRoleFromUserId } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const { token, userId } = getAuth();
    const inferredRole = inferRoleFromUserId(userId);
    const role = (inferredRole || getStoredRole()).trim().toUpperCase();
    const isAdmin = Boolean(token && userId && role === 'ADMIN');

    if (!isAdmin) {
      router.replace('/login');
      return;
    }

    if (inferredRole) {
      localStorage.setItem('role', inferredRole);
    }

    setCheckingAuth(false);
  }, [router]);

  const navItems = useMemo(
    () => [
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/shops', label: 'Shops', icon: Store },
    ],
    []
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
          Checking admin access...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 rounded-2xl bg-slate-900 p-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Admin Panel</p>
          <h2 className="mt-2 text-xl font-black">Management</h2>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-cyan-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-gray-50 min-h-screen">{children}</main>
    </div>
  );
}
