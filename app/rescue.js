// Combine the envelope, checking and debt projections into actions the
// household can read. A budget move reallocates existing assignments.
// The checking buffer changes the forecast's opening cash. The extra
// card payment is a separate comparison from the debt schedule.
import { debtOutlook, DEBT_BOOST } from './debt.js';
import { coverMoves } from './envelopes.js';
import { cashflowForecast } from './forecast.js';
import { money, prettyDate } from './money.js';

const BUFFER_INCREMENT = 50;
const EMERGENCY_FUND_ID = 'g1';
const DEFAULT_SOURCE = 'Emergency fund';

function moveStep(move) {
  const { fromName, toName, amount } = move;
  return `Move ${money(amount)} from ${fromName} to ${toName}.`;
}

export function budgetRescue(records) {
  const { moves, uncovered } = coverMoves(records);
  const steps = moves.map(moveStep);

  // Donors are limited to positive wants. If their combined capacity
  // is short, explain what is missing without suggesting partial moves.
  if (uncovered > 0) {
    steps.push(`The available want envelopes fall ${money(uncovered)} short of covering the overspending.`);
  }

  return {
    moves,
    uncovered,
    steps,
  };
}

function cashflowSteps({ needed, buffer, sourceName, transferDate, rescuedLowPoint }) {
  if (needed === 0) {
    return ['Checking stays at or above zero throughout the forecast.'];
  }

  // Capitalize the fund's name only when it begins a sentence. Here it
  // follows the amount and reads as the source account.
  return [
    `Move ${money(buffer)} from the ${sourceName.toLowerCase()} into checking on ${prettyDate(transferDate)}.`,
    `With that buffer, checking bottoms out at ${money(rescuedLowPoint.balance)} on ${prettyDate(rescuedLowPoint.date)}.`,
  ];
}

export function cashflowRescue(records) {
  const { lowPoint } = cashflowForecast(records);
  const needed = Math.max(0, -lowPoint.balance);

  // Round the raw forecast shortfall upward in fixed increments. Compare
  // the increment against the raw value, before applying display rounding.
  // An exact multiple needs no further increment. If checking already
  // covers the full window, both the shortfall and the buffer are zero.
  let buffer = Math.ceil(needed / BUFFER_INCREMENT) * BUFFER_INCREMENT;
  const sourceName = records.goals.find(goal => goal.id === EMERGENCY_FUND_ID)?.name ?? DEFAULT_SOURCE;

  // Apply the transfer at close of the ledger day, one day before the
  // window opens. Rerunning the same walk also verifies the minimum after
  // every day-to-day expense and every scheduled event.
  const transferDate = records.today;
  let { lowPoint: rescuedLowPoint } = cashflowForecast(records, buffer);

  // The second walk can land a fraction below zero at an exact increment
  // because it accumulates floating-point balances from a new starting value.
  if (rescuedLowPoint.balance < -1e-9) {
    buffer += BUFFER_INCREMENT;
    ({ lowPoint: rescuedLowPoint } = cashflowForecast(records, buffer));
  }
  if (rescuedLowPoint.balance < 0) {
    rescuedLowPoint = { ...rescuedLowPoint, balance: 0 };
  }

  return {
    needed,
    buffer,
    sourceName,
    rescuedLowPoint,
    steps: cashflowSteps({
      needed,
      buffer,
      sourceName,
      transferDate,
      rescuedLowPoint,
    }),
  };
}

export function fullRescuePlan(records) {
  const budget = budgetRescue(records);
  const cashflow = cashflowRescue(records);
  const { monthsSaved, interestSaved } = debtOutlook(records);

  // Keep the comparison amounts separate from the action sentences so
  // the goals and forecast pages can format the same computed figures
  // for their own layouts. A null comparison indicates that at least
  // one payment plan has no finite payoff.
  const debtBoost = {
    extraPerMonth: DEBT_BOOST,
    monthsSaved,
    interestSaved,
  };

  return {
    budget,
    cashflow,
    debtBoost,
  };
}
