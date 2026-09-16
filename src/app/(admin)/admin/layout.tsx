import Link from 'next/link';
import { AdminSessionProvider } from '@/components/admin/AdminSessionProvider';
import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <div className="min-h-screen">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link href="/admin" className="font-semibold tracking-tight text-slate-900">
              increasefilesize <span className="text-slate-400">admin</span>
            </Link>
            <AdminNav />
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
      </div>
    </AdminSessionProvider>
  );
}
