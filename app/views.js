import {
  amountTotal, categoryRows, goalProjection, nextBills, overviewFigures,
  rule503020, savingsRate, totals,
} from './budget.js';
import { debtOutlook, DEBT_BOOST } from './debt.js';
import { envelopePlan } from './envelopes.js';
import { cashflowForecast, safeToSpendPerDay } from './forecast.js';
import { daysBetween, money, percent, prettyDate, prettyMonth } from './money.js';
import { budgetRescue, cashflowRescue, fullRescuePlan } from './rescue.js';

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => entities[character]);
const words = new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' });
const dayMonth = date => shortDate.format(new Date(date));

function pageHeading(title, subtitle) {
  return `
    <div class="page-heading">
      <h1 tabindex="-1">${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle)}</p>
    </div>`;
}

function dateTag(date) {
  return `<time datetime="${escapeHtml(date)}">${prettyDate(date)}</time>`;
}

function summaryCard(label, amount, detail, accent = '') {
  return summaryValueCard(label, money(amount), detail, accent);
}

function summaryValueCard(label, value, detail, accent = '') {
  return `
    <div class="summary-card ${accent}">
      <dt>${label}</dt>
      <dd class="summary-amount">${escapeHtml(value)}</dd>
      <dd class="summary-detail">${detail}</dd>
    </div>`;
}

function bar(points, tone = '', target) {
  const fill = Math.min(100, Math.max(0, points));
  return `
    <span class="bar ${tone}" aria-hidden="true" style="--fill: ${fill}%">
      <span class="bar-fill"></span>
      ${target === undefined ? '' : `<span class="bar-target" style="--target: ${target}%"></span>`}
    </span>`;
}

export function categoryBar(row) {
  const label = Number.isFinite(row.pctUsed) ? percent(row.pctUsed) : 'No budget';
  return `
    <span class="category-meter${row.over ? ' is-over' : ''}">
      ${bar(row.pctUsed, row.over ? 'bar-over' : '')}
      <span class="meter-value">${label}</span>
    </span>`;
}

function categoryItem(row) {
  const remaining = row.over ? `over by ${money(-row.left)}` : `${money(row.left)} left`;
  return `
    <li class="category-item${row.over ? ' is-over' : ''}">
      <div class="category-top">
        <span class="category-name">${escapeHtml(row.name)}</span>
        <span class="category-remaining">${remaining}</span>
      </div>
      ${categoryBar(row)}
      <span class="category-spent">${money(row.spent)} of ${money(row.budget)}</span>
    </li>`;
}

function ruleRow({ name, amount, pct, target }) {
  const atTarget = Math.abs(pct - target) < 0.05;
  const verdict = atTarget ? 'At the target' : pct > target ? 'Above the target' : 'Below the target';
  return `
    <li class="rule-row">
      <div class="rule-heading">
        <span>${name}</span>
        <strong class="number">${percent(pct)}</strong>
      </div>
      ${bar(pct, 'bar-rule', target)}
      <div class="rule-detail">
        <span>${money(amount)} · ${percent(target)} target</span>
        <span>${verdict}</span>
      </div>
    </li>`;
}

function billRow(bill) {
  return `
    <li class="compact-row">
      <div><strong>${escapeHtml(bill.name)}</strong>${dateTag(bill.nextDue)}</div>
      <span class="number">${money(bill.amount)}</span>
    </li>`;
}

function transactionRow(transaction, category, compact = false) {
  const name = escapeHtml(transaction.name);
  const amount = money(transaction.amount);
  if (compact) {
    return `
      <li class="compact-row">
        <div><strong>${name}</strong>${dateTag(transaction.date)}</div>
        <span class="number">${amount}</span>
      </li>`;
  }

  return `
    <tr>
      <td class="transaction-date">${dateTag(transaction.date)}</td>
      <th class="transaction-name" scope="row">${name}</th>
      <td class="transaction-category">${escapeHtml(category)}</td>
      <td class="transaction-amount number">${amount}</td>
    </tr>`;
}

function newestFirst(transactions) {
  return [...transactions].reverse().sort((first, second) => second.date.localeCompare(first.date));
}

function forecastBanner(records) {
  const forecast = cashflowForecast(records);
  const { lowPoint, days, endDate } = forecast;
  const month = monthName.format(new Date(endDate));
  const firstNegative = days.find(day => day.balance < 0);
  let heading = `The ${month} outlook`;
  let message = `Cashflow forecast, next ${days.length} days: checking stays ${lowPoint.balance === 0 ? 'at or above' : 'above'} zero.`;

  if (firstNegative) {
    heading = `The ${month} squeeze`;
    const { buffer, sourceName, rescuedLowPoint } = cashflowRescue(records);
    const rent = records.bills.find(bill => bill.name === 'Rent');
    const salary = records.forecastIncome.find(income => income.id === 'fi-salary-main');
    const gap = rent && salary ? daysBetween(rent.nextDue, salary.date) : 0;
    const rentTiming = gap > 0 && rent.nextDue === firstNegative.date && salary.date <= endDate
      ? ` — the rent lands ${gap === 2 ? 'two' : gap} ${gap === 1 ? 'day' : 'days'} before the main salary`
      : '';
    const threshold = rescuedLowPoint.balance > 0 ? 'above' : 'at or above';
    message = `Cashflow forecast, next ${days.length} days: checking dips below zero on ${dayMonth(firstNegative.date)}, bottoming at ${money(lowPoint.balance)} on ${dayMonth(lowPoint.date)}${rentTiming}. A ${money(buffer)} buffer from the ${sourceName.toLowerCase()} keeps every day ${threshold} zero.`;
  }

  return `
    <section class="panel forecast-banner" aria-labelledby="forecast-banner-title">
      <div>
        <h2 id="forecast-banner-title">${heading}</h2>
        <p>${escapeHtml(message)}</p>
      </div>
      <a href="#/forecast">See the ${days.length}-day forecast</a>
    </section>`;
}

export function renderOverview(records) {
  const figures = overviewFigures(records);
  const rule = rule503020(records);
  const ruleName = rule.map(part => part.target).join('/');
  return `
    ${pageHeading('Monthly overview', `As of ${prettyDate(records.today)}`)}
    <dl class="summary-grid" aria-label="Monthly figures">
      ${summaryCard('Money in', figures.income, 'Income received')}
      ${summaryCard('Spent so far', figures.spent, 'Across your categories', 'summary-spent')}
      ${summaryCard('Sent to savings', figures.savings, `${percent(savingsRate(records))} of income`, 'summary-savings')}
      ${summaryCard('Left in checking', figures.checking, 'After spending and savings', 'summary-checking')}
    </dl>
    ${forecastBanner(records)}

    <div class="overview-grid">
      <section class="panel category-panel" aria-labelledby="category-heading">
        <div class="panel-heading">
          <h2 id="category-heading">Where the money went</h2>
          <p>Spending against your monthly budgets</p>
        </div>
        <ul class="category-list">${categoryRows(records).map(categoryItem).join('')}</ul>
      </section>

      <div class="overview-side">
        <section class="panel" aria-labelledby="rule-heading">
          <div class="panel-heading">
            <h2 id="rule-heading">The ${ruleName} rule</h2>
            <p>Share of income against each target</p>
          </div>
          <ul class="rule-list">${rule.map(ruleRow).join('')}</ul>
        </section>

        <section class="panel" aria-labelledby="next-bills-heading">
          <div class="panel-heading panel-heading-link">
            <h2 id="next-bills-heading">Next bills</h2>
            <a href="#/bills">All bills</a>
          </div>
          <ul class="compact-list">${nextBills(records).slice(0, 3).map(billRow).join('')}</ul>
        </section>

        <section class="panel" aria-labelledby="activity-heading">
          <div class="panel-heading panel-heading-link">
            <h2 id="activity-heading">Recent activity</h2>
            <a href="#/transactions">All transactions</a>
          </div>
          <ul class="compact-list">
            ${newestFirst(records.transactions).slice(0, 6).map(entry => transactionRow(entry, '', true)).join('')}
          </ul>
        </section>
      </div>
    </div>`;
}

export function renderBudgetLeft(row) {
  return `<span class="number${row.over ? ' is-over' : ''}">${money(row.left)}</span>`;
}

export function renderBudgetTotals(rows) {
  const { budget, spent, left } = totals(rows);
  return `
    <tr>
      <th scope="row">Total</th>
      <td class="kind-cell"></td>
      <td class="budget-total number" data-label="Budget">${money(budget)}</td>
      <td class="spent-cell number" data-label="Spent">${money(spent)}</td>
      <td class="left-cell number${left < 0 ? ' is-over' : ''}" data-label="Left">${money(left)}</td>
      <td class="usage-cell"></td>
    </tr>`;
}

export function renderBudgetSummary(rows) {
  const over = rows.filter(row => row.over);
  if (over.length === 0) return 'Every category is within budget.';

  const items = over.map(row => `${row.name} by ${money(-row.left)}`);
  return `<span class="is-over">Over budget in ${escapeHtml(words.format(items))}.</span>`;
}

function envelopeSummary(plan) {
  const { income, assignedTotal, assignedToBudgets, assignedToSavings, unassigned } = plan;
  const status = unassigned < 0
    ? `${money(-unassigned)} is assigned beyond your income.`
    : unassigned === 0 ? 'Every dollar is assigned.' : `${money(unassigned)} is still unassigned.`;
  return `Of ${money(income)} coming in, ${money(assignedTotal)} has a job — ${money(assignedToBudgets)} in envelopes and ${money(assignedToSavings)} to savings. ${status}`;
}

export function renderEnvelopeSummary(records) {
  const summary = envelopeSummary(envelopePlan(records));
  const { steps } = budgetRescue(records);
  return `${escapeHtml(summary)}${steps.length ? ` <span>${escapeHtml(steps.join(' '))}</span>` : ''}`;
}

export function renderBudget(records) {
  const rows = categoryRows(records);
  return `
    ${pageHeading('Budget planner', 'Adjust a category budget to see what you have left this month.')}
    <section class="panel table-panel" aria-label="Category budgets">
      <p class="budget-summary" id="budget-summary" role="status">${renderBudgetSummary(rows)}</p>
      <p class="envelope-summary" id="envelope-summary" role="status">${renderEnvelopeSummary(records)}</p>
      <table class="ledger-table budget-table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Kind</th>
            <th scope="col">Budget</th>
            <th scope="col">Spent</th>
            <th scope="col">Left</th>
            <th scope="col">Used</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <th scope="row">${escapeHtml(row.name)}</th>
              <td class="kind-cell"><span class="kind kind-${row.kind}">${row.kind}</span></td>
              <td class="budget-cell" data-label="Budget">
                <label class="amount-field">
                  <span aria-hidden="true">$</span>
                  <input type="number" min="0" step="0.01" inputmode="decimal" required
                    aria-label="${escapeHtml(row.name)} budget" data-category="${escapeHtml(row.id)}"
                    value="${row.budget}">
                </label>
              </td>
              <td class="spent-cell number" data-label="Spent">${money(row.spent)}</td>
              <td class="left-cell" data-label="Left">${renderBudgetLeft(row)}</td>
              <td class="usage-cell" data-label="Used">${categoryBar(row)}</td>
            </tr>`).join('')}
        </tbody>
        <tfoot id="budget-totals">${renderBudgetTotals(rows)}</tfoot>
      </table>
    </section>`;
}

function categoryOptions(categories) {
  return categories.map(({ id, name }) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join('');
}

export function renderTransactionList(records, category, search) {
  const names = new Map(records.categories.map(item => [item.id, item.name]));
  const query = search.trim().toLowerCase();
  const filtered = newestFirst(records.transactions).filter(entry => {
    const matchesCategory = category === '' || entry.category === category;
    const matchesSearch = [entry.name, names.get(entry.category)].some(
      text => text.toLowerCase().includes(query),
    );
    return matchesCategory && matchesSearch;
  });
  const noun = filtered.length === 1 ? 'transaction' : 'transactions';

  return {
    summary: `${filtered.length} ${noun} · ${money(amountTotal(filtered))} shown`,
    rows: filtered.length
      ? filtered.map(entry => transactionRow(entry, names.get(entry.category))).join('')
      : '<tr class="empty-row"><td colspan="4">No transactions match these filters.</td></tr>',
  };
}

export function renderTransactions(records) {
  const options = categoryOptions(records.categories);
  const list = renderTransactionList(records, '', '');

  return `
    ${pageHeading('Transactions', `Spending recorded in your ${records.month} ledger.`)}
    <section class="panel transaction-panel" aria-labelledby="add-heading">
      <div class="panel-heading"><h2 id="add-heading">Add a transaction</h2></div>
      <form id="add-transaction" class="transaction-form">
        <label>Date<input type="date" name="date" value="${escapeHtml(records.today)}" required></label>
        <label>Name<input type="text" name="name" maxlength="120" required></label>
        <label>Category<select name="category" required>
          <option value="">Choose a category</option>${options}
        </select></label>
        <label>Amount ($)<input type="number" name="amount" min="0.01" step="0.01" inputmode="decimal" required></label>
        <button type="submit">Add transaction</button>
      </form>
      <p class="form-status" id="transaction-status" role="status"></p>
    </section>
    <section class="panel table-panel" aria-labelledby="transaction-heading">
      <div class="panel-heading"><h2 id="transaction-heading">Transaction history</h2></div>
      <div class="transaction-filters">
        <label>Category<select id="category-filter"><option value="">All categories</option>${options}</select></label>
        <label>Search<input type="search" id="transaction-search" placeholder="Name or category"></label>
        <p id="transaction-count" role="status">${list.summary}</p>
      </div>
      <table class="ledger-table transaction-table">
        <thead><tr>
          <th scope="col">Date</th>
          <th scope="col">Name</th>
          <th scope="col">Category</th>
          <th scope="col">Amount</th>
        </tr></thead>
        <tbody id="transaction-rows">${list.rows}</tbody>
      </table>
    </section>`;
}

function dueLabel(days) {
  if (days === 0) return 'Due today';
  if (days < 0) return `Due ${-days} ${days === -1 ? 'day' : 'days'} ago`;
  return `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
}

export function renderBills(records) {
  const bills = nextBills(records);
  return `
    ${pageHeading('Bills', `Recurring payments as of ${prettyDate(records.today)}.`)}
    <dl class="bills-total">
      ${summaryCard('Monthly bills total', amountTotal(bills), 'Recurring payments', 'summary-savings')}
    </dl>
    <section class="panel table-panel" aria-label="Upcoming bills">
      <table class="ledger-table bills-table">
        <thead><tr>
          <th scope="col">Bill</th>
          <th scope="col">Amount</th>
          <th scope="col">Day of month</th>
          <th scope="col">Next due date</th>
        </tr></thead>
        <tbody>
          ${bills.map((bill, index) => `
            <tr>
              <th scope="row">${escapeHtml(bill.name)}</th>
              <td class="number" data-label="Amount">${money(bill.amount)}</td>
              <td class="number" data-label="Day of month">${bill.dueDay}</td>
              <td class="bill-date" data-label="Next due">
                ${dateTag(bill.nextDue)}
                ${index === 0 ? `<span class="due-tag">${dueLabel(bill.daysUntilDue)}</span>` : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </section>`;
}

function forecastChart({ days, lowPoint, startDate, endDate }) {
  const balances = days.map(day => day.balance);
  const high = Math.max(0, ...balances);
  const low = Math.min(0, lowPoint.balance);
  const span = high - low || 1;
  const baseline = high === low ? 50 : high / span * 100;
  const lowIndex = days.findIndex(day => day.date === lowPoint.date);
  const chartLabel = `Daily closing checking balances from ${dayMonth(startDate)} to ${prettyDate(endDate)}. Lowest on ${dayMonth(lowPoint.date)} at ${money(lowPoint.balance)}.`;
  return `
    <figure class="panel forecast-chart" aria-labelledby="forecast-chart-heading">
      <div class="panel-heading">
        <h2 id="forecast-chart-heading">Checking balance by day</h2>
      </div>
      <div class="forecast-chart-body" role="img" aria-label="${escapeHtml(chartLabel)}"
        style="--days: ${days.length}; --zero: ${baseline}%; --low-x: ${(lowIndex + .5) / days.length * 100}%">
        <div class="forecast-chart-labels" aria-hidden="true">
          <span class="forecast-low-label${low < 0 ? ' is-over' : ''}">${dayMonth(lowPoint.date)} low</span>
        </div>
        <div class="forecast-plot" aria-hidden="true">
          <div class="forecast-zero"><span>${money(0)}</span></div>
          ${days.map(({ date, balance }) => `
            <div class="forecast-column${date === lowPoint.date ? ' is-low' : ''}"
              title="${dayMonth(date)} · ${money(balance)}">
              <div class="forecast-bar${balance < 0 ? ' is-negative' : ''}"
                style="--bar-height: ${Math.abs(balance) / span * 100}%"></div>
            </div>`).join('')}
        </div>
        <div class="forecast-chart-labels forecast-ticks" aria-hidden="true">
          ${days.map(({ date }, index) => {
            const dayNumber = new Date(date).getUTCDate();
            return [1, 10, 20].includes(dayNumber)
              ? `<span style="--column: ${index + 1}">${dayMonth(date)}</span>`
              : '';
          }).join('')}
        </div>
      </div>
    </figure>`;
}

function forecastEventList(days) {
  const entries = days.flatMap(({ balance, events }) => events.map(event => ({ ...event, balance })));
  return `
    <section class="panel forecast-events-panel" aria-labelledby="forecast-events-heading">
      <div class="panel-heading">
        <h2 id="forecast-events-heading">Scheduled income and outflows</h2>
        <p>Closing balances include day-to-day spending.</p>
      </div>
      <ul class="compact-list forecast-events">
        ${entries.length ? entries.map(({ date, name, amount, balance }) => `
          <li class="compact-row">
            <div><strong>${escapeHtml(name)}</strong>${dateTag(date)}</div>
            <div class="forecast-event-figures">
              <strong class="number${amount > 0 ? ' event-inflow' : ''}">${amount > 0 ? '+' : ''}${money(amount)}</strong>
              <span class="number${balance < 0 ? ' is-over' : ''}">${money(balance)} at close</span>
            </div>
          </li>`).join('') : '<li class="compact-row">No scheduled events in this window.</li>'}
      </ul>
    </section>`;
}

function rescuePanel(records) {
  const { budget, cashflow, debtBoost } = fullRescuePlan(records);
  const { extraPerMonth, monthsSaved, interestSaved } = debtBoost;
  const extra = money(extraPerMonth);
  const debtStep = monthsSaved === null
    ? `An extra ${extra} a month toward the card has no comparable payoff estimate.`
    : `Pay ${extra} more a month toward the card: debt-free ${monthsSaved} months sooner, ${money(interestSaved)} less interest.`;
  const steps = [...budget.steps, ...cashflow.steps, debtStep];
  return `
    <section class="panel rescue-panel" aria-labelledby="rescue-heading">
      <div class="panel-heading"><h2 id="rescue-heading">Rescue plan</h2></div>
      <ul class="rescue-steps">${steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ul>
    </section>`;
}

function envelopesPanel(records) {
  const plan = envelopePlan(records);
  const fund = records.goals.find(goal => goal.id === 'g1');
  let suggestion = '';
  if (plan.unassigned > 0 && fund) {
    const current = goalProjection(fund, records.monthKey).reachDateLabel;
    const boosted = goalProjection({ ...fund, saved: fund.saved + plan.unassigned }, records.monthKey).reachDateLabel;
    const action = `Assigning the unassigned ${money(plan.unassigned)} to the ${fund.name.toLowerCase()} as a one-off`;
    if (boosted && current && boosted !== current) {
      suggestion = `${action} brings its reach date from ${current} to ${boosted}.`;
    } else if (boosted && !current) {
      suggestion = `${action} reaches the target in ${boosted}.`;
    } else {
      suggestion = `${action} adds to the amount already saved.`;
    }
  }

  return `
    <section class="panel table-panel envelopes-panel" aria-labelledby="envelopes-heading">
      <div class="panel-heading">
        <h2 id="envelopes-heading">Zero-based envelopes</h2>
        <p>${escapeHtml(envelopeSummary(plan))}</p>
      </div>
      <table class="ledger-table envelope-table">
        <thead><tr>
          <th scope="col">Envelope</th>
          <th scope="col">Assigned</th>
          <th scope="col">Spent</th>
          <th scope="col">Remaining</th>
          <th scope="col">Rollover</th>
        </tr></thead>
        <tbody>
          ${plan.rows.map(row => `
            <tr${row.state === 'over' ? ' class="is-over"' : ''}>
              <th scope="row">${escapeHtml(row.name)}</th>
              <td class="number" data-label="Assigned">${money(row.assigned)}</td>
              <td class="number" data-label="Spent">${money(row.spent)}</td>
              <td class="number" data-label="Remaining">${money(row.remaining)}</td>
              <td class="number" data-label="Rollover">${money(row.rollover)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      ${suggestion ? `<p class="envelope-suggestion">${escapeHtml(suggestion)}</p>` : ''}
    </section>`;
}

export function renderForecast(records) {
  const forecast = cashflowForecast(records);
  const { startDate, endDate, lowPoint, endBalance, days } = forecast;
  const dates = `${dayMonth(startDate)} – ${prettyDate(endDate)}`;
  const month = monthName.format(new Date(`${records.monthKey}-01`));
  return `
    ${pageHeading(`${days.length}-day cashflow forecast`, `${dates} · built from your bills, your paydays and ${month}'s day-to-day pace`)}
    <dl class="summary-grid three-cards forecast-summary" aria-label="Forecast summary">
      ${summaryCard('Low point', lowPoint.balance, dateTag(lowPoint.date), lowPoint.balance < 0 ? 'summary-danger' : '')}
      ${summaryCard(`Balance on ${dayMonth(endDate)}`, endBalance, 'Projected closing balance', 'summary-savings')}
      ${summaryCard('Safe to spend', safeToSpendPerDay(records), 'per day for the rest of the window', 'summary-checking')}
    </dl>
    ${forecastChart(forecast)}
    ${rescuePanel(records)}
    ${forecastEventList(days)}
    ${envelopesPanel(records)}`;
}

function debtCard(debt, { base, monthsSaved, interestSaved }) {
  const payoff = base.payoffMonthKey ? prettyMonth(base.payoffMonthKey) : 'No payoff at this payment';
  const acceleration = monthsSaved === null
    ? ''
    : `+${money(DEBT_BOOST)} a month: free ${monthsSaved} months sooner, ${money(interestSaved)} less interest`;
  return `
    <article class="panel goal-card debt-card">
      <h2>${escapeHtml(debt.name)}</h2>
      <p class="goal-saved"><strong class="number">${money(debt.balance)}</strong> at ${percent(debt.apr * 100, { precise: true })} APR</p>
      <dl class="goal-details">
        <div><dt>Monthly payment</dt><dd class="number">${money(debt.monthlyPayment)}</dd></div>
        <div><dt>Projected payoff</dt><dd>${payoff}</dd></div>
        <div><dt>Total interest</dt><dd class="number">${base.totalInterest === null ? '—' : money(base.totalInterest)}</dd></div>
      </dl>
      ${acceleration ? `<p class="debt-boost">${acceleration}</p>` : ''}
      <p class="goal-note">${escapeHtml(debt.note)}</p>
    </article>`;
}

export function renderGoals(records) {
  const outlook = debtOutlook(records);
  const payoff = outlook.base.payoffMonthKey ? prettyMonth(outlook.base.payoffMonthKey) : '—';
  const saved = amountTotal(records.goals.map(goal => ({ amount: goal.saved })));
  const monthly = amountTotal(records.goals.map(goal => ({ amount: goal.monthly })));
  return `
    ${pageHeading('Savings goals', 'When each savings fund could reach its target and when the card could be paid off.')}
    <dl class="summary-grid three-cards goals-summary" aria-label="Goals summary">
      ${summaryCard('Saved across all goals', saved, 'Current savings balances')}
      ${summaryCard('Going in each month', monthly, 'Planned savings contributions', 'summary-savings')}
      ${summaryValueCard('Debt-free by', payoff, 'At the current card payment', 'summary-checking')}
    </dl>
    <div class="goal-grid">
      ${records.goals.map(goal => {
        const projection = goalProjection(goal, records.monthKey);
        const months = projection.monthsRemaining;
        const duration = months === null ? 'No contributions scheduled' : `${months} ${months === 1 ? 'month' : 'months'}`;
        return `
          <article class="panel goal-card">
            <h2>${escapeHtml(goal.name)}</h2>
            <p class="goal-saved"><strong class="number">${money(goal.saved)}</strong> of ${money(goal.target)}</p>
            ${bar(projection.pctSaved, 'bar-goal')}
            <p class="goal-percent">${percent(projection.pctSaved)} saved</p>
            <dl class="goal-details">
              <div><dt>Monthly contribution</dt><dd class="number">${money(goal.monthly)}</dd></div>
              <div><dt>Time remaining</dt><dd>${duration}</dd></div>
              <div><dt>Projected reach</dt><dd>${projection.reachDateLabel ?? '—'}</dd></div>
            </dl>
            <p class="goal-note">${escapeHtml(goal.note)}</p>
          </article>`;
      }).join('')}
      ${debtCard(records.debt, outlook)}
    </div>`;
}
