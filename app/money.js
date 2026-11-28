const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const dollarsWithCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
const percentages = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});
const precisePercentages = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 2,
});
const fullDate = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthAndYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function money(amount) {
  const rounded = Math.round(amount * 100) / 100 || 0;
  return (Number.isInteger(rounded) ? dollars : dollarsWithCents).format(rounded);
}

export function percent(points, { precise = false } = {}) {
  return (precise ? precisePercentages : percentages).format(points / 100);
}

export function prettyDate(isoDate) {
  return fullDate.format(new Date(isoDate));
}

export function daysBetween(start, end) {
  return (Date.parse(end) - Date.parse(start)) / 86_400_000;
}

export function addMonths(yearMonth, count) {
  const date = new Date(`${yearMonth}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + count);
  return date.toISOString().slice(0, 7);
}

export function prettyMonth(yearMonth) {
  return monthAndYear.format(new Date(`${yearMonth}-01T00:00:00Z`));
}
