export default function slugify(text: string): string {
  const map: Record<string, string> = {
    ' ': '-',
    _: '-',
    '&': '-',
    '+': '-',
  };
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\u0980-\u09FFa-z0-9\s\-]/g, '')
    .replace(/[\s_&+]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}