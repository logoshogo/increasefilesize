import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          The admin area for increasefilesize.com.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
