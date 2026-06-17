'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { axiosInstance } from '@/lib/axios';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing verification token.');
        return;
      }

      try {
        const res = await axiosInstance.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email successfully verified!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The token might be expired or invalid.');
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center">
          <Loader2 className="h-16 w-16 text-blue-400 animate-spin mb-4" />
          <h2 className="text-2xl font-semibold text-white">Verifying...</h2>
          <p className="text-gray-400 mt-2">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-4" />
          <h2 className="text-2xl font-semibold text-white">Verified!</h2>
          <p className="text-gray-400 mt-2">{message}</p>
          <Link
            href="/login"
            className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all"
          >
            Go to Login
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center">
          <XCircle className="h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-semibold text-white">Verification Failed</h2>
          <p className="text-gray-400 mt-2">{message}</p>
          <Link
            href="/register"
            className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 transition-all"
          >
            Back to Registration
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="w-full relative z-10 px-4">
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
