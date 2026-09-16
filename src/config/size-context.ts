/**
 * Real-world context for each target size.
 *
 * This is what stops the programmatic landing pages reading as forty copies of
 * the same page: each size gets prose about where that specific figure turns
 * up and what a file of that size actually contains. Sizes not listed here
 * fall back to the nearest band.
 */

import { KB, MB } from '@/lib/engines/bytes';

export interface SizeContext {
  heading: string;
  paragraphs: string[];
}

export const SIZE_CONTEXT: Record<number, SizeContext> = {
  [10 * KB]: {
    heading: 'What a 10KB file usually is',
    paragraphs: [
      '10KB is signature territory. Examination boards and banking forms that ask for a scanned signature typically want it between 10KB and 20KB, because a signature is a small area of mostly white paper and compresses down to almost nothing. It is common to scan one and find it arrives at 4KB, below the floor the form has set.',
      'At this size an image is roughly 300×100 pixels of black ink on white, or a heavily compressed thumbnail. If a portal is demanding at least 10KB, it is not asking for detail — it is checking that you uploaded something real rather than a blank box.',
    ],
  },
  [20 * KB]: {
    heading: 'What a 20KB file usually is',
    paragraphs: [
      '20KB is the most common floor for passport-style photographs on government and examination portals, usually stated as a band of 20KB to 50KB alongside pixel dimensions such as 200×230. A phone photo cropped to that size can easily land at 12KB, which fails the check despite looking perfectly sharp.',
      'A 20KB JPG is around 300×400 pixels at moderate compression — enough for a face to be clearly identifiable on screen, which is all the requirement is really testing for.',
    ],
  },
  [30 * KB]: {
    heading: 'What a 30KB file usually is',
    paragraphs: [
      '30KB sits in the middle of the photograph band that identity and examination portals ask for, and it is a frequent upper limit for signature uploads on the same forms. Requirements written as "between 20KB and 50KB" are satisfied comfortably by a 30KB file, which is why it is a safer target than either end of that range.',
      'At 30KB a JPG holds roughly 400×500 pixels of a well-lit photograph, or a full page of scanned text in black and white.',
    ],
  },
  [50 * KB]: {
    heading: 'What a 50KB file usually is',
    paragraphs: [
      '50KB is the ceiling of the standard photograph band on most identity portals and the floor on a number of university and employment application systems. It is also a common maximum for profile photographs on internal HR systems, which means the same file sometimes has to be above one form’s minimum and below another’s maximum.',
      'A 50KB JPG is around 600×600 pixels at reasonable quality, or a clean greyscale scan of an A4 page. There is real detail in a file this size — small print in a scanned document is generally readable.',
    ],
  },
  [60 * KB]: {
    heading: 'What a 60KB file usually is',
    paragraphs: [
      '60KB is an unusual figure to see in a specification, which is exactly why people search for it: it normally comes from a form stating a range like "50KB to 100KB" where a specific file has to be pushed just over the halfway mark, or from a validator whose error message quotes an exact number.',
      'At 60KB a photograph holds around 700×700 pixels, and a colour scan of a document page is legible at full zoom without visible compression blocking.',
    ],
  },
  [80 * KB]: {
    heading: 'What an 80KB file usually is',
    paragraphs: [
      '80KB tends to come up when a form asks for "under 100KB but a reasonable quality scan", leaving applicants to aim somewhere below the ceiling with margin to spare. It is a comfortable size for a single-page document scan and for identity photographs on systems with a more generous limit.',
      'An 80KB JPG carries roughly 800×800 pixels of photographic detail, which is enough for a printed copy at postcard size to look clean.',
    ],
  },
  [100 * KB]: {
    heading: 'What a 100KB file usually is',
    paragraphs: [
      '100KB is the single most common minimum in upload requirements, and it is the round number specifications reach for when they want "a proper scan, not a thumbnail". Visa applications, professional registration bodies and university admissions portals all use it, often as the floor of a 100KB–200KB band.',
      'A 100KB JPG is roughly 1000×1000 pixels of photographic detail, or a colour scan of an A4 page at around 150 DPI. Documents at this size are comfortably readable, which is what the requirement is trying to guarantee.',
    ],
  },
  [150 * KB]: {
    heading: 'What a 150KB file usually is',
    paragraphs: [
      '150KB usually appears as the midpoint of a 100KB–200KB requirement, and as the minimum on portals that handle multi-page documents rather than single photographs. Aiming for the middle of a stated band is sensible: it leaves room for the KB-versus-KiB disagreement between operating systems and validators.',
      'At 150KB a scan holds an A4 page in colour at good quality, or a photograph at roughly 1200×1200 pixels.',
    ],
  },
  [200 * KB]: {
    heading: 'What a 200KB file usually is',
    paragraphs: [
      '200KB is normally a ceiling rather than a floor, but it turns up as a minimum on portals that expect a multi-page PDF or a high-resolution scan of an identity document. Where it is stated as a maximum, hitting exactly 200KB is the wrong move — aim slightly under, because validators disagree about whether a kilobyte is 1,000 or 1,024 bytes.',
      'A 200KB file is a two or three page PDF of scanned text, or a photograph at roughly 1500×1500 pixels with detail that survives printing at A5.',
    ],
  },
  [1 * MB]: {
    heading: 'What a 1MB file usually is',
    paragraphs: [
      '1MB is where requirements stop being about photographs and start being about documents. Portfolio uploads, tender submissions, planning applications and professional certification bodies all set minimums around here, on the reasoning that a serious document scanned properly will exceed it.',
      'A 1MB PDF is typically five to ten scanned pages, or one page scanned in colour at 300 DPI. A 1MB JPG is a full-resolution photograph from a modern phone camera after moderate compression.',
    ],
  },
  [2 * MB]: {
    heading: 'What a 2MB file usually is',
    paragraphs: [
      '2MB minimums show up on print submission portals, design and portfolio systems, and some grant and tender platforms — places where a small file genuinely suggests the wrong thing has been uploaded. It is also a common maximum on job application forms, so the same figure can be a floor in one place and a ceiling in another.',
      'A 2MB file is a high-resolution photograph straight off a camera, a ten to twenty page scanned PDF, or a single page scanned at 600 DPI for print.',
    ],
  },
};

/** Falls back to the nearest defined band when an exact size has no entry. */
export function getSizeContext(bytes?: number): SizeContext | null {
  if (!bytes) return null;
  const exact = SIZE_CONTEXT[bytes];
  if (exact) return exact;

  const keys = Object.keys(SIZE_CONTEXT).map(Number).sort((a, b) => a - b);
  let nearest = keys[0];
  for (const key of keys) {
    if (Math.abs(key - bytes) < Math.abs(nearest - bytes)) nearest = key;
  }
  return SIZE_CONTEXT[nearest] ?? null;
}
