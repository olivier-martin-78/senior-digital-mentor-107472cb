import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p','br','strong','em','u','s','a','ul','ol','li','blockquote','pre','code',
      'h1','h2','h3','h4','h5','h6','hr','span','div','sup','sub'
    ],
    ALLOWED_ATTR: ['href','target','rel','style','class']
  });
};
