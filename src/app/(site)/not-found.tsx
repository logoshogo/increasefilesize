import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">This page does not exist</h1>
      <p className="mt-4 text-slate-600">
        The tool you were looking for may have moved. The homepage handles every format and every target
        size, so you can start there.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Go to the tool
        </Link>
        <Link
          href="/sizes"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
        >
          Browse every size
        </Link>
      </div>
    </div>
  );
}
