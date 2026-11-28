// Model a fixed-rate card with one payment per month. Interest accrues on
// the opening balance, then the payment covers the interest and reduces
// principal. The first payment is in the month after the current books.
// This is a projection, so keep full precision until money is displayed.
import { monthKey } from './data.js';
import { addMonths } from './money.js';

const MONTHS_IN_YEAR = 12;
export const DEBT_BOOST = 50;

function unavailablePayoff() {
  // An empty schedule does not imply the debt is cleared or that its
  // interest is zero. Null fields mean there is no finite projection.
  return {
    months: null,
    totalInterest: null,
    totalPaid: null,
    payoffMonthKey: null,
    schedule: [],
  };
}

function amortizationRow(balance, rate, payment, month) {
  const interest = balance * rate;
  const amountDue = balance + interest;

  // On the last month pay exactly the outstanding amount and interest.
  // Using the opening balance as principal makes the final balance
  // exactly zero even if the addition introduced floating-point noise.
  const paid = Math.min(payment, amountDue);
  const principal = paid === amountDue ? balance : paid - interest;

  return {
    month,
    payment: paid,
    interest,
    principal,
    balance: balance - principal,
  };
}

export function amortize(balance, apr, payment, ledgerMonth = monthKey) {
  if (
    ![balance, apr, payment].every(Number.isFinite) ||
    balance < 0 ||
    apr < 0 ||
    payment < 0
  ) {
    return unavailablePayoff();
  }

  // A card already at zero needs no payments. Month zero points to the
  // current ledger month and the first scheduled payment is month one.
  if (balance === 0) {
    return {
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      payoffMonthKey: ledgerMonth,
      schedule: [],
    };
  }

  const monthlyRate = apr / MONTHS_IN_YEAR;
  if (payment <= balance * monthlyRate) return unavailablePayoff();

  const schedule = [];
  let remaining = balance;
  let totalInterest = 0;
  let totalPaid = 0;
  while (remaining > 0) {
    const month = addMonths(ledgerMonth, schedule.length + 1);
    const row = amortizationRow(remaining, monthlyRate, payment, month);

    // A payment barely above the interest can be too small to advance a
    // floating-point balance. Guard against an infinite schedule.
    if (row.balance >= remaining) return unavailablePayoff();

    schedule.push(row);
    remaining = row.balance;
    totalInterest += row.interest;
    totalPaid += row.payment;
  }

  return {
    months: schedule.length,
    totalInterest,
    totalPaid,
    payoffMonthKey: schedule.at(-1).month,
    schedule,
  };
}

export function debtOutlook(records) {
  const { balance, apr, monthlyPayment } = records.debt;
  const base = amortize(balance, apr, monthlyPayment, records.monthKey);
  const accelerated = amortize(
    balance,
    apr,
    monthlyPayment + DEBT_BOOST,
    records.monthKey,
  );

  // A higher payment may make a previously unpayable plan viable. In
  // that case the new date is meaningful, while the savings against the
  // original plan cannot be expressed as a finite number.
  const comparable = base.months !== null && accelerated.months !== null;
  const monthsSaved = comparable ? base.months - accelerated.months : null;
  const interestSaved = comparable ? base.totalInterest - accelerated.totalInterest : null;

  return {
    base,
    accelerated,
    monthsSaved,
    interestSaved,
  };
}
