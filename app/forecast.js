// Forecast the 30 days after the ledger date, starting from income less
// spending and the savings transfer. Spread November's day-to-day spending
// over the elapsed days of the books (November 1–27 in the current records).
// Housing, utilities and transport are excluded from this pace and only
// enter as dated bills. On each day apply its signed events and deduct the
// daily living rate. Keep the rate unrounded throughout the walk.
import { amountTotal, overviewFigures } from './budget.js';
import { daysBetween } from './money.js';

const WINDOW_DAYS = 30;
const LIVING_CATEGORIES = new Set([
  'groceries', 'dining', 'homepets', 'fun', 'personal', 'health', 'kids',
]);

function dateAfter(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

function forecastWindow(today) {
  return {
    startDate: dateAfter(today, 1),
    endDate: dateAfter(today, WINDOW_DAYS),
  };
}

export function dailyLivingRate(records) {
  const monthStart = `${records.monthKey}-01`;
  const elapsed = daysBetween(monthStart, records.today) + 1;
  if (elapsed <= 0) return 0;

  const living = records.transactions.filter(entry =>
    LIVING_CATEGORIES.has(entry.category) &&
    entry.date >= monthStart && entry.date <= records.today,
  );
  return amountTotal(living) / elapsed;
}

export function forecastEvents(records) {
  const { startDate, endDate } = forecastWindow(records.today);
  // A transfer to savings is an outflow from the checking account.
  const events = [
    ...records.bills.map(({ nextDue, name, amount }) => ({
      date: nextDue,
      name,
      amount: -amount,
      kind: 'bill',
    })),
    ...records.forecastIncome.map(({ date, name, amount }) => ({
      date,
      name,
      amount,
      kind: 'income',
    })),
    { ...records.forecastTransfer, amount: -records.forecastTransfer.amount, kind: 'transfer' },
  ];
  return events
    .filter(({ date }) => date >= startDate && date <= endDate)
    .sort((first, second) => first.date.localeCompare(second.date));
}

function groupByDate(events) {
  const grouped = new Map();
  for (const event of events) {
    if (!grouped.has(event.date)) grouped.set(event.date, []);
    grouped.get(event.date).push(event);
  }
  return grouped;
}

// The rescue plan uses this same walk with a buffer added to checking before
// day one. The buffer affects the opening balance, not the window's income.
export function cashflowForecast(records, openingBuffer = 0) {
  const { startDate, endDate } = forecastWindow(records.today);
  const startBalance = overviewFigures(records).checking + openingBuffer;
  const livingRate = dailyLivingRate(records);
  const events = forecastEvents(records);
  const byDate = groupByDate(events);
  const days = [];
  let balance = startBalance;
  let lowPoint = null;

  for (let offset = 0; offset < WINDOW_DAYS; offset++) {
    const date = dateAfter(startDate, offset);
    const dayEvents = byDate.get(date) ?? [];
    balance += amountTotal(dayEvents) - livingRate;
    const day = { date, balance, events: dayEvents };
    days.push(day);

    // Ties go to the earliest date, using closing balances only.
    if (lowPoint === null || balance < lowPoint.balance) {
      lowPoint = { date, balance };
    }
  }

  const totalIn = amountTotal(events.filter(event => event.amount > 0));
  const datedOutflows = -amountTotal(events.filter(event => event.amount < 0));
  // Include ordinary living costs so opening balance + inflows - outflows
  // reconciles to the closing balance.
  const totalOut = datedOutflows + livingRate * days.length;
  return {
    startDate,
    endDate,
    startBalance,
    days,
    lowPoint,
    endBalance: balance,
    totalIn,
    totalOut,
  };
}

export function safeToSpendPerDay(records) {
  const forecast = cashflowForecast(records);
  // Spread the positive projected closing balance across all 30 forecast
  // days and round down to whole dollars. This measures window-end headroom.
  return Math.floor(Math.max(0, forecast.endBalance) / forecast.days.length);
}
