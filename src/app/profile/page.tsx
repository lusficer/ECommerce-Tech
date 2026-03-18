'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { 
  User, Package, MapPin, Lock, Loader2, LogOut, ShieldCheck, EyeOff, Eye
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [userId, setUserId] = useState('');
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
    const token = localStorage.getItem('accessToken');
    const storedUserId = localStorage.getItem('userId');

    if (!token || !storedUserId) {
      toast.error('Please login to view your profile!');
      router.push('/login');
      return;
    }

    setUserId(storedUserId);
    fetchProfileData(storedUserId, token);
  }, [router]);

  const fetchProfileData = async (id: string, token: string) => {
    try {
      const response = await fetch(`http://localhost:8081/api/account/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to load profile data.');

      const data = await response.json();
      if (data.profile) {
        setFormData({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
        });
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`http://localhost:8081/api/account/details/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Update profile failed. Please try again!');

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
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(`http://localhost:8081/api/account/security`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Change password fail.');
      }

      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    toast.success('Successfully logged out!');
    window.location.href = '/login';
  };

  const getRoleBadge = (id: string) => {
    if (id.startsWith('AD')) return { text: 'Admin', color: 'bg-red-100 text-red-700 border-red-200' };
    if (id.startsWith('SHOP_MNG')) return { text: 'Shop Manager', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    if (id.startsWith('VEND')) return { text: 'Vendor', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (id.startsWith('WM')) return { text: 'Warehouse', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    return { text: 'Customer', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  const roleBadge = getRoleBadge(userId);

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

            <Link href="/orders" className="flex items-center justify-between p-4 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all w-full text-left">
              <div className="flex items-center gap-3"><Package className="w-5 h-5" /> My Orders</div>
            </Link>

            <button onClick={() => setActiveTab('address')} className={`flex items-center justify-between p-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'address' ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20' : 'text-slate-600 hover:bg-slate-50'}`}>
              <div className="flex items-center gap-3"><MapPin className="w-5 h-5" /> My Address</div>
            </button>
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