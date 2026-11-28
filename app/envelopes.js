// Give income a job in category envelopes or in savings. An envelope carries
// its remaining amount into the next month, including a negative remainder
// for a category that overspent. Cover suggestions are optional transfers
// between envelopes and leave both recorded spending and total assignments
// intact.
import { amountTotal, categoryRows, incomeTotal } from './budget.js';

const toCents = amount => Math.round(amount * 100);
const fromCents = amount => amount / 100;

export function envelopeRows(records) {
  return categoryRows(records).map(category => {
    const {
      id,
      name,
      kind,
      budget,
      spent,
      left,
      over,
    } = category;

    return {
      id,
      name,
      kind,
      assigned: budget,
      spent,
      remaining: left,
      state: over ? 'over' : 'within',
      rollover: left,
    };
  });
}

export function envelopePlan(records) {
  const rows = envelopeRows(records);
  const income = incomeTotal(records);
  const assignedToBudgets = amountTotal(rows.map(row => ({ amount: row.assigned })));
  const assignedToSavings = records.savingsTransfer.amount;

  // Use cents for both sums and differences so a budget edit with cents
  // cannot create a floating-point remainder.
  const assignedCents = toCents(assignedToBudgets) + toCents(assignedToSavings);
  const assignedTotal = fromCents(assignedCents);
  const unassigned = fromCents(toCents(income) - assignedCents);

  return {
    income,
    assignedToBudgets,
    assignedToSavings,
    assignedTotal,
    unassigned,
    rows,
  };
}

function eligibleDonors(rows) {
  return rows
    .filter(row => row.kind === 'want' && row.remaining > 0)
    .map(row => ({
      id: row.id,
      name: row.name,
      available: toCents(row.remaining),
    }));
}

function transfer(donor, recipient, amount) {
  return {
    fromId: donor.id,
    fromName: donor.name,
    toId: recipient.id,
    toName: recipient.name,
    amount: fromCents(amount),
  };
}

export function coverMoves(records) {
  const rows = envelopeRows(records);
  const recipients = rows.filter(row => row.state === 'over');
  const donors = eligibleDonors(rows);

  const needed = recipients.reduce((sum, row) => sum + toCents(-row.remaining), 0);
  const available = donors.reduce((sum, donor) => sum + donor.available, 0);
  const uncovered = Math.max(0, needed - available);

  // Return no partial plan if the want envelopes cannot cover the full
  // shortfall. Report the amount beyond their combined capacity.
  if (uncovered > 0 || needed === 0) {
    return { moves: [], uncovered: fromCents(uncovered) };
  }

  const moves = [];
  for (const recipient of recipients) {
    let remaining = toCents(-recipient.remaining);

    // Start each recipient with the current largest donor. Preserve the
    // category order for equally funded donors via the stable sort.
    donors.sort((first, second) => second.available - first.available);
    for (const donor of donors) {
      if (remaining === 0) break;
      if (donor.available === 0) continue;

      const amount = Math.min(remaining, donor.available);
      moves.push(transfer(donor, recipient, amount));
      donor.available -= amount;
      remaining -= amount;
    }
  }

  // Track donors' available funds across recipients so no dollar is
  // promised more than once. Recipient and donor records remain unchanged.
  return { moves, uncovered: 0 };
}
