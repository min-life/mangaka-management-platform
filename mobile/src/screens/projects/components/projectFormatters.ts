export function formatProjectDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getProjectDateRange(createdAt: string, updatedAt: string) {
  return `${formatProjectDate(createdAt)} - ${formatProjectDate(updatedAt)}`;
}
