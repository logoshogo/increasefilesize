/**
 * Seeds the database with:
 *   - the single admin user (from ADMIN_EMAIL / ADMIN_PASSWORD)
 *   - the ten starter blog articles
 *   - the landing pages from src/config/target-pages.ts, so the admin page
 *     manager has a row for each one from the start
 *   - default site settings
 *
 * Safe to re-run: everything is upserted, and existing article content is left
 * alone so edits made in the admin are never overwritten.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { BLOG_SEEDS } from '../src/config/blog-seed';
import { TARGET_PAGES } from '../src/config/target-pages';
import { DEFAULT_SETTINGS } from '../src/lib/settings';

async function main() {
  /* ---- admin user ---- */
  const email = (process.env.ADMIN_EMAIL ?? 'admin@increasefilesize.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'T92kh8ZK9nUs4wCW4z';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Admin', passwordHash },
  });
  console.log(`Admin user ready: ${admin.email}`);
  if (password === 'T92kh8ZK9nUs4wCW4z') {
    console.warn('  ⚠ Using the default password. Set ADMIN_PASSWORD before deploying.');
  }

  /* ---- articles ---- */
  let created = 0;
  for (const seed of BLOG_SEEDS) {
    const existing = await prisma.article.findUnique({ where: { slug: seed.slug } });
    if (existing) continue;
    await prisma.article.create({
      data: {
        slug: seed.slug,
        title: seed.title,
        excerpt: seed.excerpt,
        content: seed.content,
        metaTitle: seed.metaTitle,
        metaDescription: seed.metaDescription,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: admin.id,
      },
    });
    created += 1;
  }
  console.log(`Articles: ${created} created, ${BLOG_SEEDS.length - created} already present`);

  /* ---- landing pages ---- */
  let pageCount = 0;
  for (let index = 0; index < TARGET_PAGES.length; index += 1) {
    const page = TARGET_PAGES[index];
    await prisma.targetPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        slug: page.slug,
        format: page.format,
        targetBytes: page.targetBytes ?? null,
        targetLabel: page.targetLabel ?? null,
        keyword: page.keyword,
        kind: page.kind,
        defaultMode: page.defaultMode ?? 'pad',
        h1Override: page.h1Override ?? null,
        titleOverride: page.titleOverride ?? null,
        metaOverride: page.metaOverride ?? null,
        introOverride: page.introOverride ?? null,
        sortOrder: index,
      },
    });
    pageCount += 1;
  }
  console.log(`Landing pages: ${pageCount} rows ensured`);

  /* ---- settings ---- */
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: String(value) },
    });
  }
  console.log('Default settings ensured');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
