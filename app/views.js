import {
  amountTotal, categoryRows, goalProjection, nextBills, overviewFigures,
  rule503020, savingsRate, totals,
} from './budget.js';
import { money, percent, prettyDate } from './money.js';

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => entities[character]);
const words = new Intl.ListFormat('en-US', { style: 'long', type: 'conjunction' });

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
  return `
    <div class="summary-card ${accent}">
      <dt>${label}</dt>
      <dd class="summary-amount">${money(amount)}</dd>
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

export function renderBudget(records) {
  const rows = categoryRows(records);
  return `
    ${pageHeading('Budget planner', 'Adjust a category budget to see what you have left this month.')}
    <section class="panel table-panel" aria-label="Category budgets">
      <p class="budget-summary" id="budget-summary" role="status">${renderBudgetSummary(rows)}</p>
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

export function renderGoals(records) {
  return `
    ${pageHeading('Savings goals', 'How much you’ve saved and when each fund could reach its target.')}
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
    </div>`;
}
