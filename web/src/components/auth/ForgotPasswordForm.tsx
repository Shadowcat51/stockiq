'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { axiosInstance } from '@/lib/axios';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      setSuccess(response.data.message || 'Link reset password telah dikirim ke email Anda.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Forgot Password
        </h2>
        <p className="text-gray-400 mt-2">Enter your email to receive a reset link</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-2">
          <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
          {success}
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

        <button
          type="submit"
          disabled={isLoading || !!success}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <Loader2 className="animate-spin h-5 w-5 text-white" />
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-400">
        <Link href="/login" className="flex items-center justify-center font-medium text-blue-400 hover:text-blue-300 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </p>
    </div>
  );
}
