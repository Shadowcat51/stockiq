'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { axiosInstance } from '@/lib/axios';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      await logout();
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="w-full max-w-2xl relative z-10 px-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-3xl p-12 text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
              Selamat, Anda telah login! 🎉
            </h1>
            <p className="text-xl text-gray-300">
              Selamat datang di StockIQ, <span className="text-blue-400 font-semibold">{user?.name || user?.email || 'Trader'}</span>.
            </p>
          </div>

          <div className="p-6 bg-black/20 rounded-2xl border border-white/10 mb-8 inline-block text-left min-w-[300px]">
            <p className="text-sm text-gray-400 mb-1">Informasi Akun:</p>
            <p className="text-white font-medium">Email: {user?.email}</p>
            {user?.name && <p className="text-white font-medium">Nama: {user?.name}</p>}
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-500/30"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout & Kembali ke Landing Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
