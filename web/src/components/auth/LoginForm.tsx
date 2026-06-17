'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { axiosInstance } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { useEffect } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Check if we just returned from Google OAuth
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const authDataStr = Object.fromEntries(hashParams.entries())['']; // The whole hash is uri-encoded string in my implementation
        // Actually, my implementation was: redirectUrl.hash = hashData; 
        // So window.location.hash is just the encodeURIComponent string
        
        const rawHash = window.location.hash.substring(1);
        if (rawHash) {
          const authData = JSON.parse(decodeURIComponent(rawHash));
          if (authData && authData.accessToken && authData.user) {
            setAuth(authData.user, authData.accessToken);
            window.location.hash = ''; // Clear hash
            router.push('/dashboard');
          }
        }
      } catch (e) {
        console.error('Failed to parse auth hash', e);
      }
    }
    
    // Check for error query param
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('error') === 'oauth_failed') {
      setError('Google login failed. Please try again.');
    } else if (searchParams.get('error') === 'not_verified') {
      setError('Harap verifikasi email Anda terlebih dahulu. Silakan cek kotak masuk email Anda.');
    } else if (searchParams.get('error') === 'account_not_found') {
      setError('Akun Google ini belum terdaftar. Silakan melakukan Register terlebih dahulu.');
    } else if (searchParams.get('error') === 'account_exists') {
      setError('Akun sudah terdaftar. Silakan langsung melakukan Login.');
    }
    
    // Check for success message query param
    if (searchParams.get('message') === 'check_email') {
      setSuccessMsg('Akun berhasil didaftarkan. Silakan cek email Anda untuk memverifikasi akun sebelum login.');
    }
  }, [router, setAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.accessToken);
      router.push('/dashboard'); // Redirect to dashboard after login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <p className="text-gray-400 mt-2">Sign in to your StockIQ account</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl leading-5 bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            placeholder="Email Address"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-xl leading-5 bg-gray-900/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
            placeholder="Password"
          />
        </div>

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300">
            Forgot your password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 group"
        >
          {isLoading ? (
            <Loader2 className="animate-spin h-5 w-5 text-white" />
          ) : (
            <>
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-gray-400 bg-[#0f172a]">Or continue with</span>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="http://localhost:4001/api/auth/google?action=login"
            className="w-full flex justify-center py-3 px-4 border border-gray-600 rounded-xl shadow-sm bg-gray-800/50 text-sm font-medium text-gray-200 hover:bg-gray-700/50 focus:outline-none transition-colors duration-200"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </a>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        Don't have an account?{' '}
        <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
