/**
 * Seed articles for the blog. These are written into the Article table by
 * `npm run db:seed` and are fully editable afterwards in /admin/articles —
 * the database is the source of truth once seeded, this file only bootstraps
 * it and provides slugs for internal linking on the landing pages.
 */

export interface BlogSeed {
  slug: string;
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  /** Topic tags used to pick a relevant article to link from a landing page. */
  topics: ('kb' | 'mb' | 'quality' | 'resolution' | 'limits' | 'compression' | 'pdf' | 'os' | 'safety')[];
  /** Tiptap-compatible HTML. */
  content: string;
}

const p = (...paras: string[]) => paras.map((t) => `<p>${t}</p>`).join('\n');

export const BLOG_SEEDS: BlogSeed[] = [
  {
    slug: 'kb-vs-mb-difference-uploads',
    title: "KB vs MB: What's the Difference and Why It Matters for Uploads",
    excerpt:
      'One megabyte is 1,024 kilobytes. That single conversion is behind most rejected uploads — here is how to read a form’s size limit correctly.',
    metaTitle: 'KB vs MB: The Difference and Why Uploads Fail — increasefilesize.com',
    metaDescription:
      'A megabyte is 1,024 kilobytes. Learn how KB and MB relate, why upload forms disagree about the numbers, and how to check your file’s real size.',
    topics: ['kb', 'mb', 'limits'],
    content: `${p(
      'A kilobyte (KB) is 1,024 bytes and a megabyte (MB) is 1,024 kilobytes, so 1MB equals 1,024KB. A 500KB file is therefore about half a megabyte, and a form that asks for "minimum 1MB" will reject a 900KB file. That single conversion causes most confused upload errors.',
    )}
<h2>Why your computer and the upload form sometimes disagree</h2>
${p(
  'There are two conventions in circulation. The binary convention, used by Windows and by nearly every upload validator, treats 1KB as 1,024 bytes. The decimal convention, used by macOS since 2009 and by hard drive manufacturers, treats 1KB as 1,000 bytes. A file macOS reports as 105KB may be 102.5KB to the server checking it.',
  'The gap is small at kilobyte scale — about 2.4% — but it widens as files grow. At megabyte scale the difference is roughly 4.9%, which is enough to fail a "must be at least 2MB" check on a file your Mac insists is 2MB.',
)}
<h2>How to read a size requirement safely</h2>
${p(
  'When a form states a minimum, aim a little above it rather than exactly at it. If it wants at least 100KB, produce 105KB. If it wants at least 1MB, produce 1.1MB. The margin costs nothing and absorbs any disagreement between conventions.',
  'When a form states a maximum, aim below it by the same logic. A file that is exactly at the ceiling is the one most likely to be rejected by a validator using a different definition of the unit.',
)}
<h2>Checking the real size of a file</h2>
${p(
  'On Windows, right-click the file, choose Properties, and read the "Size" line rather than "Size on disk" — the second figure includes filesystem block padding and is usually larger. On macOS, select the file and press Command+I; the Info panel shows the byte count in parentheses, which is the number that actually matters.',
  'If you need to move a file from one side of a threshold to the other, the <a href="/">file size tool on the homepage</a> sets an exact figure in KB or MB rather than leaving you to guess with a quality slider.',
)}`,
  },
  {
    slug: 'why-upload-forms-require-minimum-file-size',
    title: 'Why Do Some Upload Forms Require a Minimum File Size?',
    excerpt:
      'Minimum size rules are a crude proxy for image quality. Here is what the people who wrote those rules were actually trying to prevent.',
    metaTitle: 'Why Upload Forms Require a Minimum File Size — increasefilesize.com',
    metaDescription:
      'Upload forms set minimum file sizes to screen out unreadable scans and placeholder images. Learn why the rule exists and how to meet it.',
    topics: ['limits'],
    content: `${p(
      'Upload forms require a minimum file size because file size is an easy, if crude, proxy for whether a scan or photo is detailed enough to be read. A 6KB passport scan is almost certainly unusable; a 200KB one probably is not. Rather than analysing image quality, the form checks bytes.',
    )}
<h2>What the rule is really screening for</h2>
${p(
  'Government portals, university applications and job boards receive enormous volumes of documents that a human eventually has to read. The failure they care about is the illegible one: a photograph of a photograph, a scan at 50 DPI, a signature that has been compressed into a grey smudge. Those files are almost always small, so a floor on file size filters out a large share of them without any image analysis at all.',
  'A second motive is catching placeholder uploads. A blank white JPG, a 1-pixel image or an empty PDF page all come in tiny. A minimum size makes the laziest way of getting past a required field stop working.',
)}
<h2>Why the rule catches legitimate files too</h2>
${p(
  'Modern phones and scanners are good at compression. A clean, well-lit scan of a plain text document can come out at 40KB and still be perfectly legible at full zoom. Efficient formats make it worse: the same photo saved as WebP or a modern JPG encoder can be a third the size of the file the form’s authors had in mind when they set the threshold.',
  'The result is a file that is entirely fit for purpose and still rejected. Nothing is wrong with it except the byte count.',
)}
<h2>Meeting the minimum without damaging the file</h2>
${p(
  'There are two honest ways to do it. You can genuinely add image data by rescanning at a higher DPI or resampling to larger pixel dimensions, which is the right answer if the file really is too low-quality. Or you can pad the file, which adds bytes that decoders ignore and leaves the image untouched, which is the right answer when the file is fine and only the number is wrong.',
  'The <a href="/">tool on this site</a> does the second by default and offers the first as an option. Both run in your browser, so the document never leaves your device — worth knowing when the file in question is a passport or a bank statement.',
)}`,
  },
  {
    slug: 'does-increasing-file-size-reduce-quality',
    title: 'Does Increasing File Size Reduce Image Quality? (Explained)',
    excerpt:
      'Padding a file cannot reduce its quality, because it never touches the image data. Re-encoding can. The difference matters.',
    metaTitle: 'Does Increasing File Size Reduce Image Quality? — increasefilesize.com',
    metaDescription:
      'Padding a file adds bytes decoders ignore, so the image is pixel-identical. Re-encoding is what costs quality. Here is how to tell them apart.',
    topics: ['quality', 'compression'],
    content: `${p(
      'No — increasing a file’s size by padding it cannot reduce image quality, because the padding is written into metadata areas that image decoders skip. The pixels that come out of the padded file are bit-for-bit identical to the original. Quality is only ever lost when a file is re-encoded, which is a different operation.',
    )}
<h2>Two different things that both "increase file size"</h2>
${p(
  'Padding adds inert bytes to a container. In a JPG those bytes go into COM (comment) marker segments; in a PNG they go into ancillary tEXt chunks; in a PDF they go into an unreferenced stream object. Every one of these is defined by its format’s specification as something a reader may ignore, and readers do ignore them. The image data is not read, rewritten or recompressed.',
  'Re-encoding decodes the image to raw pixels and compresses it again with different settings. That is what happens when you move a quality slider, and it is a lossy round trip for JPG: each pass discards a little more detail, whether the resulting file is larger or smaller than the one you started with.',
)}
<h2>Why a larger re-encode can still look worse</h2>
${p(
  'This surprises people. If you take a JPG that was saved at quality 60 and re-save it at quality 95, the file gets bigger — but it does not get better. The detail thrown away at quality 60 is gone, and the second pass faithfully preserves the damaged version while spending more bytes doing it. You end up with a larger file that looks fractionally worse than the original, because it has been through two lossy compressions instead of one.',
  'This is why "increase quality" tools that simply re-save at a higher setting are misleading. You cannot recover discarded detail by asking for more bytes.',
)}
<h2>What upscaling actually does</h2>
${p(
  'Resampling to larger pixel dimensions is a genuine change: a 600×400 image redrawn at 1800×1200 really does contain more pixels, and for print or large display that can be what you need. But the new pixels are interpolated from the existing ones, so the result is bigger rather than sharper. It will not reveal a licence plate or a line of small print that was not legible before.',
  'If your goal is to satisfy an upload form, padding is the better choice: exact, instant, and provably lossless. If your goal is a physically larger image, use the resolution mode and accept that it is enlargement, not enhancement. The <a href="/blog/file-size-vs-resolution">difference between file size and resolution</a> is worth reading if this distinction is new.',
)}`,
  },
  {
    slug: 'file-size-vs-resolution',
    title: "File Size vs Resolution: They're Not the Same Thing",
    excerpt:
      'Resolution is how many pixels an image has. File size is how many bytes it takes to store them. Either can change without the other.',
    metaTitle: "File Size vs Resolution: They're Not the Same — increasefilesize.com",
    metaDescription:
      'Resolution counts pixels; file size counts bytes. Learn how compression separates the two and which one a form is actually asking about.',
    topics: ['resolution', 'quality'],
    content: `${p(
      'Resolution is the number of pixels in an image, written as width × height. File size is the number of bytes needed to store it. Compression sits between them, so a 4000×3000 photo can be 800KB and a 400×300 graphic can be 2MB. Changing one does not reliably change the other.',
    )}
<h2>How compression breaks the link</h2>
${p(
  'An uncompressed 4000×3000 photo would be about 36MB — three bytes per pixel. It arrives as an 800KB JPG because the encoder found patterns it could describe cheaply: smooth sky, repeated texture, gradual gradients. An image full of noise or fine detail compresses badly and stays large at the same pixel count.',
  'That is why the same camera produces a 1.2MB photo of a brick wall and a 300KB photo of an overcast sky, both at identical resolution.',
)}
<h2>Where DPI fits in</h2>
${p(
  'DPI (dots per inch) is a third number, and for screen use it does almost nothing. It is a tag stored in the file that tells a printer how large to render the image on paper. Changing a file’s DPI tag from 72 to 300 without resampling does not add a single pixel or a single byte of image data — it only changes the intended print dimensions.',
  'So "increase the DPI of this file" usually means one of two things: raise the tag, which changes nothing about the data, or resample to more pixels, which does. When a print shop asks for 300 DPI, they are asking for enough pixels to cover the physical size at 300 per inch.',
)}
<h2>Which one is a form asking for?</h2>
${p(
  'Read the units. Anything in KB or MB is a file size rule and is satisfied by any file of the right byte count. Anything in pixels — "minimum 600×600" — is a resolution rule and needs real pixels. Anything in DPI is usually a print requirement and is best solved by rescanning at that setting.',
  'A file size rule and a resolution rule are independent, and it is common to satisfy one while failing the other.',
)}`,
  },
  {
    slug: 'common-file-size-limits-applications-email-portals',
    title: 'Common File Size Limits for Job Applications, Email Attachments, and Government Portals',
    excerpt:
      'A reference table of the size limits you are most likely to run into, and what to do when your file falls outside them.',
    metaTitle: 'Common File Size Limits: Jobs, Email and Government Portals — increasefilesize.com',
    metaDescription:
      'The upload size limits you hit most often — email attachments, job portals, visa and exam applications — and how to meet them.',
    topics: ['limits', 'kb', 'mb'],
    content: `${p(
      'Most upload limits fall into a small number of familiar ranges: email attachments cap at 20–25MB, job application portals typically allow 2–5MB per document, and government and examination portals often impose both a floor and a ceiling, commonly between 20KB and 200KB for photographs and signatures.',
    )}
<h2>Email attachments</h2>
${p(
  'Gmail and Outlook both cap attachments at around 25MB, and because attachments are encoded for transport the practical ceiling is nearer 20MB. Neither imposes a minimum. The complication is the recipient: corporate mail gateways frequently enforce a stricter limit than the sender’s provider, so a message that leaves your outbox can still bounce.',
)}
<h2>Job application portals</h2>
${p(
  'Applicant tracking systems — Workday, Greenhouse, Taleo and the rest — generally allow 2MB to 5MB per document and accept PDF and DOCX. Minimums are rare here. The more common failure is a scanned CV that arrives as a 12MB image-only PDF, which is both too large and unsearchable by the system’s parser.',
)}
<h2>Government and examination portals</h2>
${p(
  'This is where minimums appear, and where most people meet this problem for the first time. Photograph and signature uploads for visa applications, national ID services and competitive examinations routinely specify a band: a photo between 20KB and 50KB, a signature between 10KB and 20KB, a document between 100KB and 200KB. Both ends are enforced, and the error messages are rarely specific about which end you failed.',
  'Dimensions are often specified alongside, in pixels or millimetres. Meeting the byte requirement does not exempt you from the pixel requirement, and the two are <a href="/blog/file-size-vs-resolution">independent of each other</a>.',
)}
<h2>When your file is under the minimum</h2>
${p(
  'Rescanning at a higher DPI is the thorough fix and gives you a genuinely more detailed file. When the scan is already good and only the number is wrong, padding it to the exact figure the portal wants is faster and provably does not alter the image. The <a href="/">homepage tool</a> takes an exact target in KB or MB and produces that size on the first attempt.',
)}`,
  },
  {
    slug: 'how-image-compression-works',
    title: 'How Image Compression Works (And How to Reverse It)',
    excerpt:
      'Lossy compression discards detail your eye is least likely to miss. Understanding what it removes explains why it cannot be undone.',
    metaTitle: 'How Image Compression Works — And Whether It Can Be Reversed',
    metaDescription:
      'How JPG and PNG compression work, what lossy compression actually throws away, and why the discarded detail cannot be recovered.',
    topics: ['compression', 'quality'],
    content: `${p(
      'Image compression shrinks a file either by finding repetition it can describe more briefly (lossless, as in PNG) or by discarding detail the human eye is least sensitive to (lossy, as in JPG). Lossless compression is fully reversible. Lossy compression is not: the discarded information is gone from the file permanently.',
    )}
<h2>What PNG does</h2>
${p(
  'PNG first applies a per-row filter that stores the difference between each pixel and its neighbour rather than the pixel itself, which turns smooth gradients into long runs of near-zero values. Those runs are then compressed with DEFLATE, the same algorithm behind ZIP. Nothing is thrown away, so decoding returns the exact original pixels. This is why PNG is the right format for screenshots, diagrams and anything with text or hard edges — and why photographs stay large in it.',
)}
<h2>What JPG does</h2>
${p(
  'JPG splits the image into 8×8 blocks and converts each to frequency coefficients with a discrete cosine transform. Low frequencies describe broad tone, high frequencies describe fine detail. The quantisation step then divides those coefficients by a table of values and rounds the result, which sends most high-frequency coefficients to zero. Zeros compress to almost nothing, and that is where the savings come from.',
  'The quality slider scales that table. At quality 90 the divisors are small and little is lost; at quality 40 they are large and whole blocks of fine detail round away to nothing. Rounding is the step that cannot be undone — once a coefficient is zero, nothing records what it used to be.',
)}
<h2>Why "decompression" cannot restore it</h2>
${p(
  'Opening a JPG decompresses it back to pixels, but those pixels are reconstructed from the coefficients that survived. The visible artefacts of heavy compression — blocky 8×8 squares, coloured fringes around text, banding in skies — are what the surviving coefficients describe. Re-saving at a higher quality preserves the artefacts faithfully in a larger file.',
  'AI upscalers can plausibly invent detail that looks convincing, and for a print or a display that can be useful. It is invention, not recovery, and it should not be relied on where accuracy matters, such as a document being read for its content.',
)}
<h2>Making a compressed file larger</h2>
${p(
  'If the requirement is a byte count rather than genuine detail, padding the file sidesteps the whole question. It adds bytes in places the decoder skips, which leaves the compressed image data exactly as it was. That is what the <a href="/">tool on this site</a> does by default.',
)}`,
  },
  {
    slug: 'pdf-file-size-explained',
    title: 'PDF File Size Explained: What Makes a PDF Small or Large',
    excerpt:
      'Almost all of a PDF’s weight comes from embedded images and fonts. Knowing which one explains why your file is the size it is.',
    metaTitle: 'PDF File Size Explained: What Makes a PDF Large or Small',
    metaDescription:
      'What actually takes up space inside a PDF — images, fonts, and metadata — and how to make a PDF larger or smaller deliberately.',
    topics: ['pdf'],
    content: `${p(
      'A PDF’s size is dominated by what is embedded in it. Scanned pages are images and are the heaviest thing a PDF can contain; embedded font files add 50KB to several hundred KB each; text itself is almost free. A 40-page text document can be 200KB while a single scanned page can be 4MB.',
    )}
<h2>The four things that take up space</h2>
${p(
  'Images come first by a wide margin. A page scanned at 300 DPI in colour is roughly 8.7 million pixels before compression. How well it compresses depends on the encoder the scanner chose — JPEG, JPEG2000, or lossless Flate for a black-and-white scan.',
  'Embedded fonts come second. A PDF that embeds a full Unicode font can carry several hundred kilobytes of glyph outlines. Subsetting — embedding only the characters actually used — usually cuts this to a fraction.',
  'Vector graphics are third, and are usually modest: a chart is a list of drawing operations, which compresses well. The exception is a map or a CAD export, where hundreds of thousands of path segments add up.',
  'Metadata and structure are last and normally trivial: XMP metadata, the cross-reference table, bookmarks, form field definitions and digital signatures.',
)}
<h2>Why identical-looking PDFs differ in size</h2>
${p(
  'Two PDFs of the same document can differ tenfold depending on how they were produced. Exporting directly from a word processor embeds real text and subsetted fonts. Printing to PDF and scanning the result produces images of text, with no searchable characters and a much larger file. If your PDF cannot be searched with Ctrl+F, it is a stack of images, which explains its size.',
)}
<h2>Making a PDF larger on purpose</h2>
${p(
  'Portals that set a minimum PDF size are usually trying to reject unreadable scans, the same reasoning behind <a href="/blog/why-upload-forms-require-minimum-file-size">image minimums</a>. When your PDF is legible and merely efficient, padding it with an inert object gets it over the line without altering a single page. The PDF specification allows objects that nothing references, and readers ignore them, so the document renders identically.',
  'The <a href="/pdf">PDF tool on this site</a> does this in your browser using pdf-lib. The file is parsed, padded and re-saved locally, and never uploaded.',
)}`,
  },
  {
    slug: 'increase-file-size-on-windows',
    title: 'How to Increase File Size on Windows Without Software',
    excerpt:
      'Windows ships with three ways to make a file bigger — Paint, Print to PDF, and fsutil — and each has a catch worth knowing.',
    metaTitle: 'How to Increase File Size on Windows Without Software',
    metaDescription:
      'Three built-in Windows methods to increase a file’s size — Paint, Microsoft Print to PDF, and fsutil — with the limitations of each.',
    topics: ['os'],
    content: `${p(
      'Windows can increase a file’s size without extra software: resize and re-save an image in Paint, re-print a document through Microsoft Print to PDF, or create padding with the fsutil command. None of the three lets you specify an exact target size, which is their main limitation.',
    )}
<h2>Method 1: Paint (images)</h2>
${p(
  'Open the image in Paint, choose Resize, switch to Pixels, untick "Maintain aspect ratio" if you need exact dimensions, and enter larger values. Save As → JPEG or PNG. More pixels means more bytes, and saving a JPG as a PNG usually multiplies the size several times over because PNG does not use lossy compression.',
  'The catch: Paint gives you no size preview and no quality control, so hitting a specific target means resizing, saving, checking the file in Explorer, and repeating.',
)}
<h2>Method 2: Microsoft Print to PDF (documents)</h2>
${p(
  'Open the document, press Ctrl+P and choose "Microsoft Print to PDF". Printing an existing PDF back through this driver re-rasterises it, which typically produces a larger file than the original. Printing at a larger paper size increases it further.',
  'The catch: the output is a fresh rasterisation, so text in the result is no longer selectable or searchable. That can fail a portal that checks for extractable text.',
)}
<h2>Method 3: fsutil (any file — with a serious caveat)</h2>
${p(
  'Open Command Prompt as administrator and run <code>fsutil file createnew padding.txt 102400</code> to create a file of exactly 102,400 bytes. This is genuinely exact, which is why it gets recommended.',
  'The catch is important: fsutil creates a new empty file, it does not extend an existing one. Appending its output to a JPG or PDF with <code>copy /b</code> produces a file that many strict validators reject, because the trailing bytes sit outside the structure the format defines. It is not a safe way to pad a document you are about to submit.',
)}
<h2>The shorter route</h2>
${p(
  'If the requirement is an exact figure, the <a href="/">browser tool on this site</a> writes the padding into the marker segments and chunks the format specification reserves for exactly this kind of data, so the result is both exactly the size you asked for and structurally valid. It runs locally in Edge or Chrome, with nothing installed and nothing uploaded.',
)}`,
  },
  {
    slug: 'increase-file-size-on-mac',
    title: 'How to Increase File Size on Mac Without Software',
    excerpt:
      'Preview, Quick Actions and the Terminal can all make a file bigger on macOS. Here is how each one behaves.',
    metaTitle: 'How to Increase File Size on Mac Without Software',
    metaDescription:
      'Use Preview, Finder Quick Actions or Terminal to increase a file’s size on macOS — and why none of them hits an exact KB target.',
    topics: ['os'],
    content: `${p(
      'On macOS you can increase a file’s size with Preview (resize or re-export an image), with Finder’s Quick Actions, or from Terminal. Preview is the practical choice for images and PDFs, but like the Windows equivalents it cannot target an exact number of kilobytes.',
    )}
<h2>Method 1: Preview (images)</h2>
${p(
  'Open the image in Preview and choose Tools → Adjust Size. Set the units to pixels and enter larger dimensions, leaving "Resample image" ticked. Preview shows the resulting uncompressed size at the bottom of the dialog, which is a useful, if optimistic, guide. Then File → Export, choose JPEG, and drag the Quality slider — Preview shows an estimated file size as you drag.',
  'Exporting a JPG as PNG is the blunt instrument: it commonly multiplies the size by five or more, because PNG stores the JPG’s compression artefacts losslessly.',
)}
<h2>Method 2: Preview (PDFs)</h2>
${p(
  'Open the PDF and choose File → Export. In the Quartz Filter dropdown, avoid "Reduce File Size" — it is the one that shrinks. To go the other way, export the pages as images (File → Export As → PNG at a high DPI) and reassemble them into a PDF by dragging the images into Preview’s sidebar and printing to PDF. The result is substantially larger, but the text is no longer searchable.',
)}
<h2>Method 3: Terminal</h2>
${p(
  'macOS has <code>mkfile</code>, so <code>mkfile 100k padding.dat</code> creates a file of exactly 100KB, and <code>dd if=/dev/zero of=padding.dat bs=1024 count=100</code> does the same. Both create new files rather than extending existing ones, and appending their output to a real image or PDF risks producing something a strict validator rejects.',
)}
<h2>Watch the units on macOS</h2>
${p(
  'Finder reports sizes in decimal — 1KB as 1,000 bytes — while most upload validators use binary, where 1KB is 1,024 bytes. A file Finder calls 100KB is about 97.6KB to the server. Press Command+I on the file and read the exact byte count in parentheses, then aim slightly above any minimum. The <a href="/blog/kb-vs-mb-difference-uploads">KB vs MB article</a> covers this in more detail.',
)}
<h2>The shorter route</h2>
${p(
  'The <a href="/">tool on this site</a> runs in Safari or Chrome on macOS, takes an exact figure in KB or MB, and writes the padding into metadata areas the format reserves, so the file stays valid and the image is untouched. Nothing is installed and nothing is uploaded.',
)}`,
  },
  {
    slug: 'is-it-safe-to-increase-file-size-online',
    title: "Is It Safe to Increase a File's Size Online?",
    excerpt:
      'It depends entirely on whether the tool uploads your file. Here is how to check for yourself, in about thirty seconds.',
    metaTitle: "Is It Safe to Increase a File's Size Online? — increasefilesize.com",
    metaDescription:
      'Most online file tools upload your document to a server. Learn how to verify whether a tool processes files locally, in under a minute.',
    topics: ['safety'],
    content: `${p(
      'It is safe when the tool processes your file in your own browser, and a matter of trust when it uploads to a server. Most online file utilities upload. You can tell which kind you are using in about thirty seconds with your browser’s developer tools, and it is worth doing before you hand over a passport scan or a bank statement.',
    )}
<h2>What uploading actually involves</h2>
${p(
  'A server-side tool sends your file over the network to a machine you know nothing about, writes it to disk there, processes it, and stores the result until something deletes it. You are trusting the operator’s retention policy, their access controls, their backups, and their disclosure practices — usually on the strength of a privacy page, with no way to verify any of it.',
  'For a holiday photo that is a reasonable trade. For an ID document, a medical form, a contract or a payslip, it is a real exposure, and one you cannot withdraw once the upload has happened.',
)}
<h2>How to check, in your browser</h2>
${p(
  'Open the tool, press F12 (or Command+Option+I on a Mac) and select the Network tab. Tick "Preserve log". Now run the tool on a file. Watch the request list as it works.',
  'If the file is processed locally you will see no new request while the work happens — no POST, no PUT, no upload progress, nothing carrying a payload the size of your file. If it is uploaded you will see a request whose size matches your file, and you can click it to see the payload. This test is conclusive and takes less time than reading a privacy policy.',
)}
<h2>Other things worth checking</h2>
${p(
  'Does the tool work offline? Load the page, turn off your network connection, then use it. A genuinely local tool keeps working; a server-based one fails immediately. This is the simplest test of all.',
  'Does the page serve over HTTPS? If a tool does upload, an unencrypted connection means the file is also exposed in transit. And does the site explain its method, or only assert that it is "secure"? A tool that names the technique — canvas re-encoding, marker segments, pdf-lib — is describing something you can verify.',
)}
<h2>How this site works</h2>
${p(
  'Everything on increasefilesize.com runs in your browser. Your file is read with the File API, transformed in memory, and handed back to you as a download. There is no upload endpoint in the application, so there is nothing to retain and nothing to breach. Run the Network tab test above on <a href="/">the homepage tool</a> — it should stay empty while your file is processed.',
)}`,
  },
];

export const BLOG_SEED_MAP = new Map(BLOG_SEEDS.map((b) => [b.slug, b]));
