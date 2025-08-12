import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p','br','strong','em','u','s','a','ul','ol','li','blockquote','pre','code','h2','h3','hr','span'
    ],
    ALLOWED_ATTR: ['href','target','rel']
  });
};
