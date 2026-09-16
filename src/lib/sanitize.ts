import sanitizeHtml from 'sanitize-html';

/**
 * Article HTML is authored in the admin Tiptap editor and rendered with
 * dangerouslySetInnerHTML on the blog. It is sanitised on the way into the
 * database so a compromised admin session (or a paste from an untrusted
 * source) cannot plant script into public pages.
 */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'hr',
      'h2', 'h3', 'h4',
      'strong', 'b', 'em', 'i', 'u', 's', 'code', 'mark', 'sub', 'sup',
      'ul', 'ol', 'li',
      'blockquote', 'pre',
      'a', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      code: ['class'],
      pre: ['class'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? '';
        const external = /^https?:\/\//i.test(href);
        return {
          tagName,
          attribs: {
            ...attribs,
            ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          },
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: 'lazy' },
      }),
    },
  });
}

/** Turns a title into a URL slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96);
}
