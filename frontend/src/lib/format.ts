// Display helpers. Presentation only; nothing here touches the API.

export const formatPrice = (price: number | string): string =>
  `₹${Number(price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

export const formatDateTime = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';

export const formatLongDate = (date: Date = new Date()): string =>
  date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;
