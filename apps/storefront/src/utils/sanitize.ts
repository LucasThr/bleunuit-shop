import sanitizeHtmlLib from 'sanitize-html';

// CMS/product bodies are admin-authored HTML rendered with Astro's `set:html`
// (i.e. innerHTML). Run them through an allowlist before rendering so a stray
// <script>, event handler, or javascript: URI can never execute on the site.
// sanitize-html strips disallowed tags/attributes and unsafe URL schemes
// (javascript:, data:) by default.
const options: sanitizeHtmlLib.IOptions = {
  allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
  allowedAttributes: {
    ...sanitizeHtmlLib.defaults.allowedAttributes,
    '*': ['class'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
};

export function sanitizeHtml(dirty: string): string {
  return sanitizeHtmlLib(dirty, options);
}
