import { addMonths, daysBetween, prettyMonth } from './money.js';

const cents = amount => Math.round(amount * 100);
const difference = (amount, other) => (cents(amount) - cents(other)) / 100;
const share = (amount, total) => total > 0 ? amount / total * 100 : 0;

export function amountTotal(entries) {
  return entries.reduce((total, { amount }) => total + cents(amount), 0) / 100;
}

export function incomeTotal(records) {
  return amountTotal(records.income);
}

export function spentByCategory(records) {
  const spentInCents = new Map();
  for (const { category, amount } of records.transactions) {
    spentInCents.set(category, (spentInCents.get(category) ?? 0) + cents(amount));
  }
  return new Map([...spentInCents].map(([category, amount]) => [category, amount / 100]));
}

export function categoryRows(records) {
  const spent = spentByCategory(records);

  return records.categories.map(category => {
    const used = spent.get(category.id) ?? 0;
    const left = difference(category.budget, used);
    return {
      ...category,
      spent: used,
      left,
      pctUsed: category.budget === 0 && used > 0 ? Infinity : share(used, category.budget),
      over: left < 0,
    };
  });
}

export function totals(rows) {
  const budget = rows.reduce((total, row) => total + cents(row.budget), 0) / 100;
  const spent = rows.reduce((total, row) => total + cents(row.spent), 0) / 100;
  return { budget, spent, left: difference(budget, spent) };
}

export function savingsRate(records) {
  return share(records.savingsTransfer.amount, incomeTotal(records));
}

export function overviewFigures(records) {
  const income = incomeTotal(records);
  const spent = amountTotal(records.transactions);
  const savings = records.savingsTransfer.amount;
  return { income, spent, savings, checking: difference(difference(income, spent), savings) };
}

export function rule503020(records) {
  const income = incomeTotal(records);
  const rows = categoryRows(records);
  const spendingFor = kind => rows.reduce(
    (total, row) => total + (row.kind === kind ? cents(row.spent) : 0),
    0,
  ) / 100;

  return [
    { name: 'Needs', amount: spendingFor('need'), target: 50 },
    { name: 'Wants', amount: spendingFor('want'), target: 30 },
    { name: 'Savings', amount: records.savingsTransfer.amount, target: 20 },
  ].map(part => ({ ...part, pct: share(part.amount, income) }));
}

export function nextBills(records) {
  return records.bills
    .map(bill => ({ ...bill, daysUntilDue: daysBetween(records.today, bill.nextDue) }))
    .sort((first, second) => first.nextDue.localeCompare(second.nextDue));
}

export function goalProjection(goal, monthKey) {
  const remaining = Math.max(0, cents(goal.target) - cents(goal.saved));
  const monthly = cents(goal.monthly);
  const monthsRemaining = remaining === 0 ? 0 : monthly > 0 ? Math.ceil(remaining / monthly) : null;
  // The first contribution arrives the month after the books shown here.
  const reachMonth = monthsRemaining === null ? null : addMonths(monthKey, monthsRemaining);

  return {
    pctSaved: share(goal.saved, goal.target),
    monthsRemaining,
    reachMonth,
    reachDateLabel: reachMonth === null ? null : prettyMonth(reachMonth),
  };
}
