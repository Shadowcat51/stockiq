'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  LineChart, 
  PieChart, 
  Newspaper, 
  BrainCircuit, 
  Settings,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMarketStore } from '@/store/marketStore';
import { useRouter } from 'next/navigation';
import { axiosInstance } from '@/lib/axios';
import { cn } from '@/lib/utils';

import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
}

const formatEmail = (email: string | undefined) => {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const localPart = parts[0];
  const domain = parts[1];
  
  if (localPart.length > 5) {
    return `${localPart.substring(0, 5)}...@${domain}`;
  }
  return email;
};

const SidebarItem = ({ icon: Icon, label, href, active }: SidebarItemProps) => (
  <Link href={href}>
    <div className={cn(
      "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
      active 
        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
        : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
    )}>
      <Icon className={cn("w-5 h-5", active ? "text-blue-400" : "group-hover:text-gray-200")} />
      <span className="font-medium">{label}</span>
    </div>
  </Link>
);

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, logout, setAuth } = useAuthStore();
  const { isConnected, latestData } = useMarketStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    // Sinkronisasi data user jika kosong (misal saat di-refresh)
    if (!user) {
      axiosInstance.post('/auth/refresh-token')
        .then((res) => {
          setAuth(res.data.user, res.data.accessToken);
        })
        .catch(() => {
          // Jika token tidak valid / kedaluwarsa
          logout();
          router.push('/');
        });
    }
  }, [user, setAuth, logout, router]);

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

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: LineChart, label: 'Market', href: '/dashboard/market' },
    { icon: PieChart, label: 'Portfolio', href: '/dashboard/portfolio' },
    { icon: BrainCircuit, label: 'AI Insights', href: '/dashboard/ai' },
    { icon: Newspaper, label: 'News', href: '/dashboard/news' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] text-white flex overflow-hidden">
      {/* Mobile Menu Toggle */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-gray-800/80 backdrop-blur border border-gray-700 rounded-lg"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block",
        "lg:bg-transparent lg:border-none lg:backdrop-blur-none",
        "bg-gray-900/95 backdrop-blur-2xl border-r border-white/10",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-10 pl-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center">
              <span className="font-bold text-white text-lg">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              StockIQ
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <SidebarItem 
                key={item.href}
                icon={item.icon} 
                label={item.label} 
                href={item.href}
                active={pathname === item.href}
              />
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="flex items-center space-x-3 w-full">
                <div className="w-10 h-10 shrink-0 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-sm font-medium">
                  {mounted && user?.name ? user.name[0].toUpperCase() : mounted && user?.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{mounted ? (user?.name || 'User') : 'Loading...'}</p>
                  <p className="text-xs text-gray-400 truncate" title={mounted ? user?.email : ''}>
                    {mounted ? formatEmail(user?.email) : ''}
                  </p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-20 shrink-0 border-b border-white/5 bg-gray-900/30 backdrop-blur-md flex items-center justify-end px-8">
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-sm font-medium flex items-center space-x-2 text-gray-300">
              {latestData && (
                <span className="text-xs bg-gray-800 px-2 py-1 rounded border border-gray-700 hidden lg:inline-block">
                  {latestData.symbol}: <span className={latestData.price > 0 ? "text-white" : "text-white"}>{latestData.price?.toFixed(2)}</span>
                </span>
              )}
              <span>
                <span className={cn(
                  "mr-1 transition-colors duration-500",
                  isConnected ? "text-emerald-400" : "text-red-500"
                )}>●</span> 
                Live Market
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
