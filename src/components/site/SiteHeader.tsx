import Link from 'next/link';

const NAV = [
  { href: '/jpg', label: 'JPG' },
  { href: '/png', label: 'PNG' },
  { href: '/pdf', label: 'PDF' },
  { href: '/sizes', label: 'All sizes' },
  { href: '/blog', label: 'Blog' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-4 sm:py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-slate-900"
        >
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
          >
            ↑
          </span>
          {/* The full wordmark needs room; on the narrowest phones the mark carries it. */}
          <span className="hidden text-[0.95rem] xs:inline sm:text-base">
            increasefilesize<span className="text-brand-600">.com</span>
          </span>
          <span className="text-[0.95rem] xs:hidden">
            increase<span className="text-brand-600">filesize</span>
          </span>
        </Link>

        {/* Scrolls rather than pushing the page wide if the labels ever grow. */}
        <nav
          aria-label="Main"
          className="-mx-1 flex min-w-0 flex-1 items-center justify-end gap-0.5 overflow-x-auto px-1 text-sm [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-2 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
