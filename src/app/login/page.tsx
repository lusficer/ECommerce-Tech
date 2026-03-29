'use client'; 

import React, { useState } from 'react';
import Link from 'next/link';
import { EyeOff, MonitorSmartphone, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed. Please check your credentials!';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMessage = errData.error;
          }
        } catch (parseErr) {
        }
        
       
        
        throw new Error(errorMessage);
      }
      // ---------------------------------------------------------

      const data = await response.json();
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.userId) {
        localStorage.setItem('userId', data.userId);    
 
        localStorage.setItem('role', data.userId); 
      }      
      
      toast.success('Login successful! Redirecting...');
      window.location.href = '/';      
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
      <div className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-wide">
        <Link href="/" className="hover:text-cyan-600">Home</Link> <span className="mx-2">/</span> pages <span className="mx-2">/</span> <span className="text-slate-900">login</span>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row max-w-5xl mx-auto min-h-[550px]">
        
        {/* Left Side */}
        <div className="hidden md:flex w-1/2 bg-slate-50 p-12 flex-col items-center justify-center relative border-r border-slate-100">
           <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-slate-100 z-0"></div>
           <MonitorSmartphone className="w-48 h-48 text-cyan-200 relative z-10 drop-shadow-md" strokeWidth={1} />
           <h3 className="relative z-10 mt-8 text-2xl font-black text-slate-800 text-center leading-snug">
              Secure Checkout & <br/> Fast Shipping
           </h3>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <h1 className="text-3xl font-black text-cyan-600 mb-1">Welcome Back</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Login to continue</p>

          {/* Khung hiển thị lỗi */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Example@gmail.com" 
                className="w-full px-4 py-3.5 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-3.5 rounded-lg border border-slate-200 focus:outline-none focus:border-cyan-500 transition-colors bg-slate-50 focus:bg-white text-sm font-medium text-slate-900" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600"
                >
                  <EyeOff className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex justify-start">
              <Link href="#" className="text-xs font-bold text-slate-400 hover:text-cyan-600 underline underline-offset-4">Forget Password ?</Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-32 flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-cyan-600/20 hover:shadow-cyan-600/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'LOGIN'}
            </button>

            <div className="pt-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
              NEW USER ? <Link href="/register" className="text-cyan-600 hover:text-cyan-700 ml-1">SIGN UP</Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}