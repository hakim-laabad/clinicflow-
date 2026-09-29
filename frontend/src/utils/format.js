export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const formatDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');

// <input type="datetime-local"> value (local time) -> ISO string in UTC
export const localInputToISO = (v) => new Date(v).toISOString();
