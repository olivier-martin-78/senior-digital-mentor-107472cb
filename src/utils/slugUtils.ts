export function sanitizeSlug(input: string | undefined | null): string {
  const s = String(input || '').trim();
  if (!s) return '';
  // Replace dots with hyphens and normalize multiple separators
  return s
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\.+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');
}
