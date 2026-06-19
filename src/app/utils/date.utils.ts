/** Clé locale YYYY-MM-DD (évite le décalage UTC de toISOString). */
export function localDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
