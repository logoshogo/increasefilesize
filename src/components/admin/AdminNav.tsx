'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/articles', label: 'Articles' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminNav() {
  const pathname = usePathname() ?? '';
  const { data: session } = useSession();

  if (pathname === '/admin/login') return null;

  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm">
      {LINKS.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        className="rounded-lg px-3 py-1.5 font-medium text-slate-500 hover:text-slate-900"
      >
        View site ↗
      </Link>
      {session && (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="ml-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 transition hover:border-slate-400"
        >
          Sign out
        </button>
      )}
    </nav>
  );
}
