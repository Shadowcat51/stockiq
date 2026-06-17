import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In - StockIQ',
  description: 'Sign in to your StockIQ account to access real-time stock analysis.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="w-full relative z-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Stock<span className="text-blue-500">IQ</span>
          </h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
