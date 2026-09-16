/**
 * The single source of truth for every programmatic landing page.
 *
 * The dynamic route at src/app/[slug]/page.tsx, the sitemap, the internal
 * linking blocks and the admin page manager all read from here. Pages added in
 * /admin/pages are stored in the TargetPage table and merged on top of this
 * array at request time, so new target sizes never require a code change.
 */

import { KB, MB } from '@/lib/engines/bytes';

export type PageFormat = 'jpg' | 'png' | 'pdf' | 'any';
export type PageKind = 'tool' | 'informational';

export interface TargetPageConfig {
  slug: string;
  format: PageFormat;
  /** Exact byte target the embedded widget is pre-set to. */
  targetBytes?: number;
  /** Human label, e.g. "100KB". */
  targetLabel?: string;
  /** The primary keyword this page is built for. */
  keyword: string;
  kind: PageKind;
  defaultMode?: 'pad' | 'upscale';
  /** Optional copy overrides. */
  titleOverride?: string;
  metaOverride?: string;
  h1Override?: string;
  introOverride?: string;
  /** Extra prose section rendered on informational pages. */
  extraSections?: { heading: string; body: string[] }[];
}

const kb = (n: number) => ({ bytes: Math.round(n * KB), label: `${n}KB` });
const mb = (n: number) => ({ bytes: Math.round(n * MB), label: `${n}MB` });

const UNIVERSAL_SIZES = [kb(10), kb(20), kb(30), kb(50), kb(60), kb(100), kb(150), kb(200), mb(1), mb(2)];
const JPG_SIZES = [kb(20), kb(30), kb(50), kb(60), kb(80), kb(100), kb(200)];
const PDF_SIZES = [kb(100), kb(200)];

/** /increase-file-size-to-100kb — format-agnostic size pages. */
const universalPages: TargetPageConfig[] = UNIVERSAL_SIZES.map(({ bytes, label }) => ({
  slug: `increase-file-size-to-${label.toLowerCase()}`,
  format: 'any',
  targetBytes: bytes,
  targetLabel: label,
  keyword: `increase file size to ${label.toLowerCase()}`,
  kind: 'tool',
}));

/** /increase-jpg-file-size-to-50kb */
const jpgPages: TargetPageConfig[] = JPG_SIZES.map(({ bytes, label }) => ({
  slug: `increase-jpg-file-size-to-${label.toLowerCase()}`,
  format: 'jpg',
  targetBytes: bytes,
  targetLabel: label,
  keyword: `increase jpg file size to ${label.toLowerCase()}`,
  kind: 'tool',
}));

/** /increase-pdf-file-size-to-100kb */
const pdfPages: TargetPageConfig[] = PDF_SIZES.map(({ bytes, label }) => ({
  slug: `increase-pdf-file-size-to-${label.toLowerCase()}`,
  format: 'pdf',
  targetBytes: bytes,
  targetLabel: label,
  keyword: `increase file size of pdf to ${label.toLowerCase()}`,
  kind: 'tool',
}));

/**
 * Keyword variants that do not map cleanly onto a format+size pair. Each one
 * gets its own angle in the copy so the pages do not read as near-duplicates.
 */
const variantPages: TargetPageConfig[] = [
  {
    slug: 'increase-png-file-size',
    format: 'png',
    keyword: 'increase png file size',
    kind: 'tool',
    h1Override: 'Increase PNG File Size Online — Free and Exact',
    introOverride:
      'This free tool increases a PNG file to any size you choose by adding invisible metadata chunks to it. The picture itself is untouched, so it looks exactly the same. Pick your PNG, enter a target in KB or MB, and download — nothing is uploaded to a server.',
  },
  {
    slug: 'increase-png-file-size-online',
    format: 'png',
    keyword: 'increase png file size online',
    kind: 'tool',
    h1Override: 'Increase PNG File Size Online — No Software to Install',
    introOverride:
      'Increase a PNG file to an exact size online, free, with nothing to install. The tool runs in your browser tab and pads the file with invisible data, so the image looks identical and your file never leaves your device.',
  },
  {
    slug: 'increase-png-file-resolution',
    format: 'png',
    keyword: 'increase png file resolution',
    kind: 'tool',
    defaultMode: 'upscale',
    h1Override: 'Increase PNG File Resolution Free',
    introOverride:
      'This tool increases a PNG file’s resolution by redrawing it at a larger pixel size, then trims it to the exact file size you want. Choose "increase resolution" below, set a target size, and download — all of it happens in your browser, with no upload.',
  },
  {
    slug: 'increase-png-file-quality',
    format: 'png',
    keyword: 'increase png file quality',
    kind: 'tool',
    defaultMode: 'upscale',
    h1Override: 'Increase PNG File Quality and Size Free',
    introOverride:
      'This free tool re-renders a PNG at a higher pixel resolution and sets it to the exact file size you need. Detail that was thrown away by an earlier compression cannot be recovered, but the file becomes larger and higher-resolution in your browser, with no upload.',
  },
  {
    slug: 'expand-png-file',
    format: 'png',
    keyword: 'expand png file',
    kind: 'tool',
    h1Override: 'Expand a PNG File to a Bigger Size Free',
  },
  {
    slug: 'enhance-png-file',
    format: 'png',
    keyword: 'enhance png file',
    kind: 'tool',
    defaultMode: 'upscale',
    h1Override: 'Enhance a PNG File — Bigger Size, Higher Resolution',
  },
  {
    slug: 'increase-file-size-of-image',
    format: 'any',
    keyword: 'increase file size of image',
    kind: 'tool',
    h1Override: 'Increase the File Size of an Image Free',
  },
  {
    slug: 'increase-file-size-of-jpg',
    format: 'jpg',
    keyword: 'increase file size of jpg',
    kind: 'tool',
    h1Override: 'Increase the File Size of a JPG Free',
  },
  {
    slug: 'increase-file-size-in-pdf',
    format: 'pdf',
    keyword: 'increase file size in pdf',
    kind: 'tool',
    h1Override: 'Increase File Size in a PDF Free',
  },
  {
    slug: 'change-file-size-in-pdf',
    format: 'pdf',
    keyword: 'change file size in pdf',
    kind: 'tool',
    h1Override: 'Change the File Size of a PDF Free',
  },
  {
    slug: 'change-file-size-in-kb-pdf',
    format: 'pdf',
    keyword: 'change file size in kb pdf',
    kind: 'tool',
    h1Override: 'Change a PDF’s File Size in KB Free',
  },
  {
    slug: 'expand-file-size-pdf',
    format: 'pdf',
    keyword: 'expand file size pdf',
    kind: 'tool',
    h1Override: 'Expand a PDF File Size Free',
  },
  {
    slug: 'increase-file-size-of-pdf-free',
    format: 'pdf',
    keyword: 'increase file size of pdf free',
    kind: 'tool',
    h1Override: 'Increase the File Size of a PDF — Free, No Signup',
  },
  {
    slug: 'increase-file-size-of-pdf-online-free',
    format: 'pdf',
    keyword: 'increase file size of pdf online free',
    kind: 'tool',
    h1Override: 'Increase PDF File Size Online Free',
  },
  {
    slug: 'increase-pdf-file-size-online-free',
    format: 'pdf',
    keyword: 'increase pdf file size online free',
    kind: 'tool',
    h1Override: 'Increase PDF File Size Online Free — Exact KB or MB',
  },
  {
    slug: 'increase-file-size-in-kb',
    format: 'any',
    keyword: 'increase file size in kb',
    kind: 'tool',
    h1Override: 'Increase File Size in KB Free',
  },
  {
    slug: 'increase-file-size-in-mb',
    format: 'any',
    keyword: 'increase file size in mb',
    kind: 'tool',
    h1Override: 'Increase File Size in MB Free',
  },
  {
    slug: 'increase-file-size-in-kb-online',
    format: 'any',
    keyword: 'increase file size in kb online',
    kind: 'tool',
    h1Override: 'Increase File Size in KB Online — Free Browser Tool',
  },
  {
    slug: 'increase-file-size-in-mb-online',
    format: 'any',
    keyword: 'increase file size in mb online',
    kind: 'tool',
    h1Override: 'Increase File Size in MB Online — Free Browser Tool',
  },
  {
    slug: 'increase-file-size-kb-to-mb',
    format: 'any',
    keyword: 'increase file size kb to mb',
    kind: 'tool',
    targetBytes: 1 * MB,
    targetLabel: '1MB',
    h1Override: 'Increase File Size From KB to MB Free',
    introOverride:
      'This free tool takes a file measured in kilobytes and increases it to a size measured in megabytes — 1MB, 2MB or any figure you type — by padding it with invisible data. The file still opens and looks the same, and it is never uploaded anywhere.',
  },
  {
    slug: 'increase-file-size-in-pixels',
    format: 'any',
    keyword: 'increase file size in pixels',
    kind: 'tool',
    defaultMode: 'upscale',
    h1Override: 'Increase an Image’s Size in Pixels Free',
    introOverride:
      'This free tool increases an image’s pixel dimensions by redrawing it at a larger size, then sets the file to the exact size you need. Pixels and file size are different things, and the "increase resolution" mode below changes both at once — in your browser, with no upload.',
  },
  {
    slug: 'increase-file-size-in-photoshop',
    format: 'any',
    keyword: 'increase file size in photoshop',
    kind: 'informational',
    h1Override: 'How to Increase File Size in Photoshop (and a Faster Free Alternative)',
    introOverride:
      'In Photoshop, you increase a file’s size with Image → Image Size (raise the pixel dimensions or resolution) or by saving at a higher quality setting in File → Export → Save As. Both change the image data itself. If you only need the file to clear an upload form’s minimum size, the free tool below does it in seconds without Photoshop.',
    extraSections: [
      {
        heading: 'The Photoshop method, step by step',
        body: [
          'Open the file in Photoshop and choose Image → Image Size. Tick Resample, set the width or height higher, and pick "Preserve Details 2.0" from the resampling dropdown. A larger pixel count produces a larger file when you save.',
          'Then use File → Export → Export As (or the older Save for Web) and raise the Quality slider toward 100 for JPG, or choose PNG-24 instead of PNG-8. Photoshop shows the estimated file size in the export dialog, so you can nudge the slider until the estimate lands near your target.',
          'For PDFs, File → Save As → Photoshop PDF and choosing "High Quality Print" or "Press Quality" from the Adobe PDF Preset dropdown will produce a noticeably larger file than the "Smallest File Size" preset.',
        ],
      },
      {
        heading: 'Why Photoshop cannot hit an exact number',
        body: [
          'Photoshop’s quality slider is an approximation. Compression is content-dependent, so quality 87 on one photo lands at 94KB and on another at 220KB. If a form demands "at least 100KB", you end up exporting repeatedly and checking the file in your file manager each time.',
          'The tool on this page works the other way around: you type the exact number of kilobytes you need and it produces a file of exactly that size, on the first try, by padding the file with data that decoders ignore.',
        ],
      },
      {
        heading: 'When Photoshop is still the right choice',
        body: [
          'If the real problem is that your image is too small or too soft — a logo you need at print resolution, a photo that will be enlarged on a poster — then you want genuine resampling, and Photoshop’s Preserve Details algorithm is better than a browser canvas. Use the "increase resolution" mode here for a quick result, and Photoshop when the output has to hold up at print size.',
        ],
      },
    ],
  },
];

export const TARGET_PAGES: TargetPageConfig[] = [
  ...universalPages,
  ...jpgPages,
  ...pdfPages,
  ...variantPages,
];

export const TARGET_PAGE_MAP = new Map(TARGET_PAGES.map((p) => [p.slug, p]));

export function getTargetPage(slug: string): TargetPageConfig | undefined {
  return TARGET_PAGE_MAP.get(slug);
}

/** Size presets offered in every size dropdown across the site. */
export const SIZE_PRESETS = [
  ...UNIVERSAL_SIZES,
  kb(80),
  kb(300),
  kb(500),
  mb(3),
  mb(5),
].sort((a, b) => a.bytes - b.bytes);

export const FORMAT_LABEL: Record<PageFormat, string> = {
  jpg: 'JPG',
  png: 'PNG',
  pdf: 'PDF',
  any: 'File',
};

export const FORMAT_HUBS: { slug: string; format: Exclude<PageFormat, 'any'>; keyword: string }[] = [
  { slug: 'jpg', format: 'jpg', keyword: 'increase jpg file size' },
  { slug: 'png', format: 'png', keyword: 'increase png file size' },
  { slug: 'pdf', format: 'pdf', keyword: 'increase pdf file size' },
];
