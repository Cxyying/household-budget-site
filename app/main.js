import * as data from './data.js';
import { categoryRows } from './budget.js';
import {
  categoryBar, renderBills, renderBudget, renderBudgetLeft, renderBudgetSummary, renderBudgetTotals,
  renderGoals, renderOverview, renderTransactionList, renderTransactions,
} from './views.js';

const records = structuredClone({ ...data });
const routes = new Map([
  ['#/', renderOverview],
  ['#/budget', renderBudget],
  ['#/transactions', renderTransactions],
  ['#/bills', renderBills],
  ['#/goals', renderGoals],
]);
const app = document.querySelector('#app');
const links = [...document.querySelectorAll('nav a')];
const transactionFilters = { category: '', search: '' };
let currentRoute;

document.querySelector('#household').textContent = records.household;
document.querySelector('#ledger-month').textContent = records.month;
document.querySelector('#ledger-footer').textContent =
  `${records.household} · ${records.month} books, calculated on this page from your own records.`;

function wireBudget() {
  app.addEventListener('input', event => {
    const input = event.target.closest('input[data-category]');
    if (!input || !input.validity.valid) return;

    const category = records.categories.find(item => item.id === input.dataset.category);
    category.budget = input.valueAsNumber;
    const rows = categoryRows(records);
    const row = rows.find(item => item.id === category.id);
    const element = input.closest('tr');

    element.querySelector('.left-cell').innerHTML = renderBudgetLeft(row);
    element.querySelector('.usage-cell').innerHTML = categoryBar(row);
    app.querySelector('#budget-totals').innerHTML = renderBudgetTotals(rows);
    app.querySelector('#budget-summary').innerHTML = renderBudgetSummary(rows);
  });

  app.addEventListener('focusout', event => {
    const input = event.target.closest('input[data-category]');
    if (input && !input.validity.valid) {
      input.value = records.categories.find(item => item.id === input.dataset.category).budget;
    }
  });
}

function wireTransactions() {
  const category = app.querySelector('#category-filter');
  const search = app.querySelector('#transaction-search');
  const status = app.querySelector('#transaction-status');
  const form = app.querySelector('#add-transaction');

  category.value = transactionFilters.category;
  search.value = transactionFilters.search;

  function updateList() {
    transactionFilters.category = category.value;
    transactionFilters.search = search.value;
    const list = renderTransactionList(records, transactionFilters.category, transactionFilters.search);
    app.querySelector('#transaction-count').textContent = list.summary;
    app.querySelector('#transaction-rows').innerHTML = list.rows;
  }

  if (category.value || search.value) updateList();
  category.addEventListener('change', updateList);
  search.addEventListener('input', updateList);
  form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));

  form.addEventListener('submit', event => {
    event.preventDefault();
    const fields = new FormData(form);
    const name = fields.get('name').trim();

    if (!name) {
      form.elements.name.setCustomValidity('Enter a transaction name.');
      form.elements.name.reportValidity();
      return;
    }

    records.transactions.push({
      id: `added-${records.transactions.length + 1}`,
      date: fields.get('date'),
      name,
      category: fields.get('category'),
      amount: Number(fields.get('amount')),
    });
    form.reset();
    updateList();
    status.textContent = `Added ${name}.`;
  });
}

function render() {
  const route = routes.has(location.hash) ? location.hash : '#/';
  const previousRoute = currentRoute;
  currentRoute = route;
  app.innerHTML = routes.get(route)(records);

  for (const link of links) {
    if (link.hash === route) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  const active = links.find(link => link.hash === route);
  document.title = `${active.textContent} · HomeLedger`;

  if (route === '#/transactions') wireTransactions();
  if (previousRoute && previousRoute !== route) {
    app.querySelector('h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

wireBudget();
window.addEventListener('hashchange', render);
render();
