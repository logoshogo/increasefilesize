/**
 * The SEO + AEO content template.
 *
 * Every landing page and format hub is rendered from this one builder, so the
 * structure is identical across the site while the copy is composed from the
 * page's own format, target size and keyword. Phrase variants are selected by
 * a hash of the slug, which keeps each page's wording stable between builds
 * but different from its neighbours — templated, not duplicated.
 */

import { formatBytes } from '@/lib/engines/bytes';
import { BLOG_SEEDS } from '@/config/blog-seed';
import { getSizeContext } from '@/config/size-context';
import {
  FORMAT_LABEL,
  TARGET_PAGES,
  type PageFormat,
  type TargetPageConfig,
} from '@/config/target-pages';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HowToStep {
  name: string;
  text: string;
}

export interface RelatedLink {
  href: string;
  label: string;
  description?: string;
}

export interface PageContent {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  /** The AEO direct-answer block: 40-60 words, plain, liftable. */
  answer: string;
  steps: HowToStep[];
  whyHeading: string;
  why: string[];
  faqs: FaqItem[];
  related: RelatedLink[];
  format: PageFormat;
  targetBytes?: number;
  targetLabel?: string;
  keyword: string;
  defaultMode: 'pad' | 'upscale';
  extraSections?: { heading: string; body: string[] }[];
}

/* ------------------------------------------------------------------ */
/* Deterministic phrase selection                                      */
/* ------------------------------------------------------------------ */

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pick<T>(options: T[], seed: string, offset = 0): T {
  return options[(hash(seed) + offset) % options.length];
}

/* ------------------------------------------------------------------ */
/* Format-specific vocabulary                                          */
/* ------------------------------------------------------------------ */

const FORMAT_NOUN: Record<PageFormat, string> = {
  jpg: 'JPG image',
  png: 'PNG image',
  pdf: 'PDF document',
  any: 'file',
};

const FORMAT_PLURAL: Record<PageFormat, string> = {
  jpg: 'JPG images',
  png: 'PNG images',
  pdf: 'PDF documents',
  any: 'JPG, PNG and PDF files',
};

/** How the padding is actually done, per format — used in copy and FAQs. */
const PADDING_METHOD: Record<PageFormat, string> = {
  jpg: 'extra COM comment segments, a part of the JPG specification that every decoder skips',
  png: 'extra tEXt metadata chunks, an ancillary PNG block that decoders are required to ignore',
  pdf: 'an inert stream object that no page references, which PDF readers pass over',
  any: 'metadata areas that the file format reserves for data decoders ignore',
};

const ACCEPTS: Record<PageFormat, string> = {
  jpg: '.jpg and .jpeg files',
  png: '.png files',
  pdf: '.pdf files',
  any: 'JPG, PNG and PDF files',
};

/* ------------------------------------------------------------------ */
/* Builder                                                             */
/* ------------------------------------------------------------------ */

export function buildPageContent(config: TargetPageConfig): PageContent {
  const { slug, format, targetBytes, targetLabel, keyword } = config;
  const formatLabel = FORMAT_LABEL[format];
  const noun = FORMAT_NOUN[format];
  const sizeLabel = targetLabel ?? (targetBytes ? formatBytes(targetBytes) : null);
  const defaultMode = config.defaultMode ?? 'pad';
  const isUpscale = defaultMode === 'upscale';

  /* --- title / meta / h1 ------------------------------------------ */

  const title =
    config.titleOverride ??
    (sizeLabel
      ? `Increase ${formatLabel} File Size to ${sizeLabel} Online Free — increasefilesize.com`
      : `Increase ${formatLabel} File Size Online Free — increasefilesize.com`);

  const metaDescription =
    config.metaOverride ??
    (sizeLabel
      ? `Increase a ${noun} to exactly ${sizeLabel} in seconds — free, no signup, works in your browser, nothing uploaded.`
      : `Increase the size of a ${noun} to any target in KB or MB — free, no signup, works in your browser, nothing uploaded.`);

  const h1 =
    config.h1Override ??
    (sizeLabel
      ? `Increase ${formatLabel} File Size to ${sizeLabel} Free`
      : `Increase ${formatLabel} File Size Free`);

  /* --- AEO direct-answer block (40-60 words) ----------------------- */

  let answer: string;
  if (config.introOverride) {
    answer = config.introOverride;
  } else if (isUpscale) {
    answer = `This free tool increases a ${noun}${
      sizeLabel ? ` to exactly ${sizeLabel}` : ''
    } and can redraw it at a higher pixel resolution at the same time. Choose your file, set the target${
      sizeLabel ? '' : ' in KB or MB'
    }, and download the result — no signup, and the file is never uploaded to a server.`;
  } else if (sizeLabel) {
    answer = pick(
      [
        `This free tool increases a ${noun} to exactly ${sizeLabel} by padding it with invisible data, without changing how the ${
          format === 'pdf' ? 'document reads' : 'image looks'
        }. Choose your file, select ${sizeLabel}, and download the result — no signup, and no file is uploaded to a server.`,
        `To increase a ${noun} to ${sizeLabel}, upload it to the tool below, confirm the ${sizeLabel} target, and download the result. The padding is written into metadata the ${
          format === 'pdf' ? 'reader' : 'decoder'
        } ignores, so the file is byte-exact and visually unchanged. It runs in your browser — nothing is sent anywhere.`,
        `This tool makes a ${noun} exactly ${sizeLabel}, which is what upload forms with a minimum size are checking. It adds inert padding rather than re-compressing, so the ${
          format === 'pdf' ? 'document' : 'image'
        } is untouched. Free, no account, and your file stays on your own device.`,
      ],
      slug,
      7,
    );
  } else {
    answer = `This free tool increases a ${noun} to any size you need — ${
      format === 'pdf' ? '100KB, 200KB, 2MB' : '20KB, 100KB, 2MB'
    } or a figure you type — by padding it with invisible data that leaves the ${
      format === 'pdf' ? 'document' : 'image'
    } untouched. Everything runs in your browser, so nothing is uploaded.`;
  }

  /* --- How it works ------------------------------------------------ */

  const steps: HowToStep[] = [
    {
      name: `Choose your ${formatLabel === 'File' ? '' : formatLabel + ' '}file`.replace('  ', ' ').trim(),
      text: `Drag a file onto the tool above or click to browse. It accepts ${ACCEPTS[format]}, and the file is read directly by your browser rather than sent anywhere.`,
    },
    {
      name: sizeLabel ? `Confirm the ${sizeLabel} target` : 'Set your target size',
      text: sizeLabel
        ? `The target is already set to ${sizeLabel} on this page. You can change it to any other figure in KB or MB if the form you are filling in wants something different.`
        : 'Pick a preset from the dropdown or type an exact figure in KB or MB. The output will match that number byte for byte.',
    },
    {
      name: isUpscale ? 'Pick padding or a real resolution increase' : 'Choose how the size is added',
      text: isUpscale
        ? 'This page defaults to "increase resolution", which redraws the image at a larger pixel size. Switch to "pad file size" if you only need the byte count to change and want the pixels left exactly as they are.'
        : `The default pads the file with ${PADDING_METHOD[format]}, so the ${
            format === 'pdf' ? 'document' : 'image'
          } is untouched. Switch to "increase resolution" if you want more pixels as well as more bytes.`,
    },
    {
      name: 'Download the result',
      text: `Press the button and your browser saves the new file${
        sizeLabel ? `, at exactly ${sizeLabel}` : ' at exactly the size you asked for'
      }. Nothing was uploaded, so there is nothing stored anywhere for you to delete afterwards.`,
    },
  ];

  /* --- Why you might need this -------------------------------------- */

  const whyVariants: string[][] = [
    [
      `Plenty of upload forms set a *minimum* file size as well as a maximum, and reject anything under it. Government portals, visa and examination sites are the usual culprits${
        sizeLabel ? `, and ${sizeLabel} is one of the figures they ask for most often` : ''
      }. A perfectly clear scan that happens to compress well fails the check with no explanation of what is wrong.`,
      `The minimum exists to screen out unreadable scans, but it cannot tell an unreadable file from an efficiently compressed one. Padding the file to the size the form wants gets you past the validator without touching a single pixel of the ${
        format === 'pdf' ? 'document' : 'image'
      }.`,
    ],
    [
      `If a form has just told you your ${noun} is "too small", the number it is checking is bytes, not quality. Application portals, HR systems and licensing sites commonly require at least ${
        sizeLabel ?? '50KB or 100KB'
      } for a photograph, signature or supporting document, and a well-compressed file can fall below that while being perfectly legible.`,
      `Rescanning at a higher DPI would work, but it means finding the original document and the scanner again. Padding the file you already have takes a few seconds and produces exactly the figure the form is looking for.`,
    ],
    [
      `Minimum file size rules turn up wherever documents are submitted in bulk: exam boards, immigration services, banking KYC forms and university applications. The rule is a proxy for "is this scan detailed enough to read", and modern compression is good enough that it regularly catches files that are entirely fine.`,
      `Because padding writes into ${PADDING_METHOD[format]}, the file that comes out is structurally valid and visually identical${
        sizeLabel ? ` — just ${sizeLabel} instead of whatever it was` : ''
      }. The validator is satisfied and the person reading your document sees exactly what you scanned.`,
    ],
  ];

  whyVariants.push(
    [
      `The form is not judging your ${
        format === 'pdf' ? 'document' : 'image'
      } — it is judging its byte count${sizeLabel ? `, against a floor of ${sizeLabel}` : ''}. That rule was written to stop people uploading unreadable 5KB scans, and it has no way of telling those apart from a clean scan that simply compressed well.`,
      `Rescanning at a higher DPI would also clear the threshold, and if your scan really is hard to read that is the better fix. If it is fine and only the number is wrong, padding it is the honest shortcut: the bytes go into ${PADDING_METHOD[format]}, and the person who opens the file sees exactly what you scanned.`,
    ],
    [
      `Size floors turn up in the places with the most paperwork and the least flexibility${
        sizeLabel ? ` — and ${sizeLabel} is one of the numbers that appears most often` : ''
      }. Immigration services, examination boards, professional registration bodies and bank onboarding forms all use them, and none of them will explain which end of the range you failed.`,
      `Because efficient compression is what causes the problem, the answer is not to make a worse ${
        format === 'pdf' ? 'document' : 'image'
      }. Adding padding leaves the ${
        format === 'pdf' ? 'pages' : 'pixels'
      } exactly as they are${sizeLabel ? ` and puts the file at ${sizeLabel}` : ''}, which is what the validator wanted all along.`,
    ],
  );

  const why = pick(whyVariants, slug).map((t) => t.replace(/\*(.+?)\*/g, '$1'));

  const whyHeading = pick(
    [
      'Why you might need this',
      'When you would need a bigger file',
      'Why a form would reject a file for being too small',
    ],
    slug,
    1,
  );

  /* --- FAQs --------------------------------------------------------- */

  const faqs: FaqItem[] = [
    {
      question: `Will this reduce my ${format === 'pdf' ? 'PDF' : 'image'}’s quality?`,
      answer: isUpscale
        ? `No. In "increase resolution" mode the image is redrawn at a larger pixel size, so it gains pixels rather than losing them — though enlarging cannot recover detail an earlier compression already discarded. In the default padding mode nothing about the image is altered at all.`
        : pick(
            [
              `No. The padding goes into ${PADDING_METHOD[format]}, so the ${
                format === 'pdf' ? 'page content' : 'image data'
              } is never decoded or re-compressed. What comes out is ${
                format === 'pdf' ? 'the same document' : 'pixel-for-pixel identical'
              }, just larger on disk.`,
              `It cannot. Quality is only ever lost when a file is decoded and re-compressed, and this tool does neither — it writes ${PADDING_METHOD[format]} and leaves the ${
                format === 'pdf' ? 'pages' : 'compressed image data'
              } exactly as it found them. Open the original and the result side by side and they are indistinguishable, because they are.`,
              `No, and that is the point of doing it this way. Adding bytes to ${PADDING_METHOD[format]} changes the file’s size without touching the part of it that describes the ${
                format === 'pdf' ? 'document' : 'picture'
              }, so there is no mechanism by which the quality could drop.`,
            ],
            slug,
            2,
          ),
    },
    {
      question: 'Is my file uploaded to a server?',
      answer: pick(
        [
          `No. The entire process runs in your browser using the File and Canvas APIs${
            format === 'pdf' || format === 'any' ? ' and pdf-lib' : ''
          }. Your file is read from your own disk, changed in memory and handed straight back to you. You can confirm it by opening your browser’s Network tab while you use the tool — there is no upload request, because there is no upload endpoint.`,
          `No, and you do not have to take that on trust. Load this page, disconnect from the internet, and use the tool — it still works, which it could not do if your file had to reach a server. Nothing is transmitted, so there is nothing stored and nothing to delete afterwards.`,
          `Never. This site has no route that accepts a visitor file at all. Everything happens inside the browser tab you are reading this in, which is why it costs nothing to run and why a passport scan or bank statement is as safe here as it is in your own file manager.`,
        ],
        slug,
        3,
      ),
    },
    {
      question: 'What file formats are supported?',
      answer:
        format === 'any'
          ? 'JPG (including .jpeg), PNG and PDF. Each one is padded using the structure its own specification reserves for data readers can ignore, so the output is always a valid file of that type.'
          : `This page is set up for ${FORMAT_PLURAL[format]}. The tool also handles ${
              format === 'pdf' ? 'JPG and PNG images' : 'PDFs and the other image format'
            } — drop any supported file in and it will detect the type from the file itself rather than the extension.`,
    },
    {
      question: 'Why would I need to increase file size instead of decrease it?',
      answer: pick(
        [
          `Because some upload forms enforce a minimum as well as a maximum${
            sizeLabel ? `, and ${sizeLabel} is a common one` : ''
          }. The minimum is meant to reject scans too low-quality to read, but it catches efficiently compressed files too. When your file is legible and simply small, making it bigger is the only thing standing between you and a successful submission.`,
          `Minimum size rules exist because file size is the cheapest available proxy for "is this scan readable". A form cannot easily judge legibility, so it judges bytes${
            sizeLabel ? ` — often at exactly ${sizeLabel}` : ''
          }. Modern compression is good enough that a perfectly clear document lands under the threshold, and then the only thing wrong with it is the number.`,
          `It is rarely a want, usually a requirement. A portal has refused the file for being below${
            sizeLabel ? ` ${sizeLabel}` : ' its minimum'
          }, the scan itself is fine, and rescanning it at a higher DPI means finding the document and the scanner again. Padding gets the number where it needs to be in seconds.`,
        ],
        slug,
        5,
      ),
    },
    {
      question: 'Is this free to use?',
      answer: `Yes — free, with no account, no watermark, no email address and no limit on how many files you run through it. Because the work happens on your own device rather than on a server, there are no processing costs to pass on.`,
    },
  ];

  /* --- Internal links ---------------------------------------------- */

  const related = buildRelatedLinks(config);

  return {
    slug,
    title,
    metaDescription,
    h1,
    answer,
    steps,
    whyHeading,
    why,
    faqs,
    related,
    format,
    targetBytes,
    targetLabel: sizeLabel ?? undefined,
    keyword,
    defaultMode,
    extraSections: buildExtraSections(config),
  };
}

/**
 * Page-specific prose. A size page gets context about that exact figure; a
 * format page gets context about that format. This is the main thing keeping
 * the generated pages from reading as variations of one another.
 */
function buildExtraSections(
  config: TargetPageConfig,
): { heading: string; body: string[] }[] | undefined {
  const sections: { heading: string; body: string[] }[] = [];

  const sizeContext = getSizeContext(config.targetBytes);
  if (sizeContext) {
    sections.push({ heading: sizeContext.heading, body: sizeContext.paragraphs });
  } else if (config.format !== 'any') {
    sections.push(FORMAT_CONTEXT[config.format]);
  }

  if (config.extraSections) sections.push(...config.extraSections);
  return sections.length > 0 ? sections : undefined;
}

/** Used on format pages that have no specific size of their own. */
const FORMAT_CONTEXT: Record<Exclude<PageFormat, 'any'>, { heading: string; body: string[] }> = {
  jpg: {
    heading: 'Why JPG files come out smaller than you expect',
    body: [
      'JPG is a lossy format built for photographs, and it is extremely good at its job. It discards the fine detail the eye is least sensitive to, which means a sharp, well-lit photo of a document can compress to a fraction of what an upload form’s authors assumed. That is why a scan you can read perfectly well gets rejected for being too small.',
      'Padding a JPG uses COM marker segments — the comment blocks the JPEG specification defines and every decoder skips. The compressed scan data is not decoded, so the photograph that comes out is bit-for-bit the one that went in.',
    ],
  },
  png: {
    heading: 'Why PNG files behave differently',
    body: [
      'PNG is lossless, so it never throws detail away, but it is built for flat colour: screenshots, logos, diagrams and line art. A signature or a simple graphic can compress to a few kilobytes because a PNG can describe long runs of identical pixels almost for free. Photographs go the other way and stay large.',
      'Padding a PNG adds ancillary tEXt chunks before the file’s IEND marker. Ancillary chunks are the part of the specification that says decoders may ignore what they do not recognise, so the IDAT pixel data is untouched and the image is identical.',
    ],
  },
  pdf: {
    heading: 'What controls a PDF’s size',
    body: [
      'Almost all of a PDF’s weight comes from embedded images and fonts. A PDF exported straight from a word processor holds real text and a subsetted font, and can be a couple of hundred kilobytes for dozens of pages. The same document scanned as images can be several megabytes for one page.',
      'That is why PDF minimums catch people out: a properly produced, text-based PDF is small precisely because it was made well. Padding adds an inert stream object, referenced from the document catalog under a private key, which readers pass over without rendering anything.',
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Internal linking                                                    */
/* ------------------------------------------------------------------ */

const BLOG_FOR_FORMAT: Record<PageFormat, string> = {
  jpg: 'does-increasing-file-size-reduce-quality',
  png: 'file-size-vs-resolution',
  pdf: 'pdf-file-size-explained',
  any: 'why-upload-forms-require-minimum-file-size',
};

export function buildRelatedLinks(config: TargetPageConfig): RelatedLink[] {
  const links: RelatedLink[] = [];

  // Two adjacent target-size pages from the same family.
  const family = TARGET_PAGES.filter(
    (p) => p.format === config.format && typeof p.targetBytes === 'number',
  ).sort((a, b) => (a.targetBytes ?? 0) - (b.targetBytes ?? 0));

  const index = family.findIndex((p) => p.slug === config.slug);
  const neighbours: TargetPageConfig[] = [];

  if (index >= 0) {
    if (family[index - 1]) neighbours.push(family[index - 1]);
    if (family[index + 1]) neighbours.push(family[index + 1]);
    // At either end of the family, reach one further in the other direction.
    if (neighbours.length < 2 && family[index + 2]) neighbours.push(family[index + 2]);
    if (neighbours.length < 2 && family[index - 2]) neighbours.push(family[index - 2]);
  }

  if (neighbours.length < 2) {
    const fallback = TARGET_PAGES.filter(
      (p) =>
        p.slug !== config.slug &&
        typeof p.targetBytes === 'number' &&
        !neighbours.some((n) => n.slug === p.slug),
    );
    const start = hash(config.slug) % Math.max(1, fallback.length);
    while (neighbours.length < 2 && fallback.length > 0) {
      neighbours.push(fallback[(start + neighbours.length) % fallback.length]);
    }
  }

  for (const n of neighbours.slice(0, 2)) {
    links.push({
      href: `/${n.slug}`,
      label: n.h1Override ?? titleCaseKeyword(n.keyword),
      description: n.targetLabel ? `Exact ${n.targetLabel} output` : undefined,
    });
  }

  // The relevant format hub.
  if (config.format !== 'any') {
    links.push({
      href: `/${config.format}`,
      label: `All ${FORMAT_LABEL[config.format]} file size tools`,
      description: `Every ${FORMAT_LABEL[config.format]} target size in one place`,
    });
  } else {
    links.push({
      href: '/jpg',
      label: 'JPG file size tools',
      description: 'Target sizes from 20KB to 200KB',
    });
  }

  // The homepage hub.
  links.push({
    href: '/',
    label: 'Universal file size tool',
    description: 'Any format, any target size',
  });

  // One relevant blog article.
  const blogSlug = BLOG_FOR_FORMAT[config.format];
  const article = BLOG_SEEDS.find((b) => b.slug === blogSlug) ?? BLOG_SEEDS[0];
  links.push({
    href: `/blog/${article.slug}`,
    label: article.title,
    description: 'From the blog',
  });

  return links;
}

function titleCaseKeyword(keyword: string): string {
  return keyword
    .split(' ')
    .map((word) => {
      if (/^(kb|mb|jpg|png|pdf)$/i.test(word)) return word.toUpperCase();
      if (/^\d+(kb|mb)$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/* ------------------------------------------------------------------ */
/* Format hub pages                                                    */
/* ------------------------------------------------------------------ */

export function buildHubContent(format: Exclude<PageFormat, 'any'>): PageContent {
  const base = buildPageContent({
    slug: format,
    format,
    keyword: `increase ${format} file size`,
    kind: 'tool',
    h1Override: `Increase ${FORMAT_LABEL[format]} File Size — Free Online Tool`,
    titleOverride: `Increase ${FORMAT_LABEL[format]} File Size Online Free — increasefilesize.com`,
  });
  return base;
}
