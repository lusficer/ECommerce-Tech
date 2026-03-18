'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EyeOff, Fingerprint, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'SHOP_MANAGER', label: 'Shop Manager' },
  { value: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager' },
  { value: 'SHIPPER', label: 'Shipper' }, 
  { value: 'ADMIN', label: 'Admin' },
  { value: 'GUEST', label: 'Guest' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER', 
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8081/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed. Please try again!');
      }

      const data = await response.json();
      console.log('Register Success:', data);
      toast.success('Register successful! Redirecting to login page');

      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
      <div className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600">Home</Link> <span className="mx-2">/</span> pages <span className="mx-2">/</span> <span className="text-slate-900">Register</span>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto min-h-[600px]">
        
        <div className="hidden md:flex w-1/2 bg-slate-50 p-12 flex-col items-center justify-center relative border-r border-slate-100">
           <div className="absolute inset-0 bg-gradient-to-tr from-cyan-50 to-slate-100 z-0"></div>
           <Fingerprint className="w-48 h-48 text-cyan-200 relative z-10 drop-shadow-md" strokeWidth={1} />
           <h3 className="relative z-10 mt-8 text-2xl font-black text-slate-800 text-center leading-snug">
              Join TechStone <br/> Community
           </h3>
        </div>

        <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl font-black text-cyan-600 mb-1">Register</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Join to us</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} placeholder="Example@gmail.com" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="+84..." className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Account Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm font-medium text-slate-700 cursor-pointer">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleInputChange} placeholder="••••••••" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 bg-slate-50 focus:bg-white text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600">
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-32 flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-md shadow-cyan-600/20 hover:shadow-cyan-600/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'REGISTER'}
            </button>

            <div className="pt-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              ALREADY USER ? <Link href="/login" className="text-cyan-600 hover:text-cyan-700 ml-1">LOGIN</Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}