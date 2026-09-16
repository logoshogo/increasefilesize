import Link from 'next/link';
import { TARGET_PAGES } from '@/config/target-pages';

export function SiteFooter() {
  const popular = TARGET_PAGES.filter((p) => p.format === 'any' && p.targetBytes).slice(0, 8);
  const jpg = TARGET_PAGES.filter((p) => p.format === 'jpg').slice(0, 8);
  const pdf = TARGET_PAGES.filter((p) => p.format === 'pdf').slice(0, 8);

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold text-slate-900">increasefilesize.com</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Free tools that increase a JPG, PNG or PDF to an exact file size. Everything runs in your
            browser — your files are never uploaded to a server.
          </p>
        </div>

        <FooterColumn title="Popular sizes" links={popular.map(toLink)} />
        <FooterColumn title="JPG tools" links={jpg.map(toLink)} />
        <FooterColumn
          title="PDF &amp; more"
          links={[...pdf.map(toLink), { href: '/blog', label: 'Blog' }, { href: '/sizes', label: 'All tools' }]}
        />
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} increasefilesize.com</p>
          <p>Processed locally in your browser. No uploads, no accounts, no file storage.</p>
        </div>
      </div>
    </footer>
  );
}

function toLink(page: { slug: string; keyword: string; h1Override?: string }) {
  return { href: `/${page.slug}`, label: page.h1Override?.replace(/ Free$/, '') ?? capitalise(page.keyword) };
}

function capitalise(text: string) {
  return text
    .split(' ')
    .map((w) => (/^(kb|mb|jpg|png|pdf)$/i.test(w) || /^\d+(kb|mb)$/i.test(w) ? w.toUpperCase() : w))
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: title }} />
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-block py-1 text-slate-600 transition hover:text-brand-700">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
