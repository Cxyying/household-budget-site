[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/Cxyying/household-budget-site/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/Cxyying/household-budget-site/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

# HomeLedger — Household Budget

**▶ Open it online: [cxyying.github.io/household-budget-site/app](https://cxyying.github.io/household-budget-site/app/)** — no install, runs right in your browser, even offline.

A static budget site for the Miller household's November 2026 books, with zero-based envelopes, a 30-day cashflow forecast with a rescue plan, and a debt payoff engine. The overview shows income, spending, savings and checking alongside category budgets, a 50/30/20 check, upcoming bills and recent transactions.

Edit category budgets in the Budget planner, search or add spending in Transactions, and check upcoming payments in Bills. Forecast shows how paydays, bills and daily spending affect checking. Goals shows the projected dates for reaching savings targets and paying off the card. The browser calculates each figure from the household's records.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a browser. The static files under `app/` run without a build, an install, or external requests.

Use this command to bundle the app, screenshots and `dossier.json`.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/` — `data.js` holds the household's records, `budget.js` calculates monthly figures, and `money.js` formats amounts and dates.
- `app/forecast.js` — daily checking balances, scheduled events and spending headroom for the Forecast page.
- `app/envelopes.js` — zero-based assignments, rollovers and suggested moves to cover overspending.
- `app/debt.js` — credit card amortisation and the added-payment comparison.
- `app/rescue.js` — envelope moves, a checking buffer and the debt boost.
- `app/views.js` — Overview, Budget planner, Transactions, Bills, Forecast and Goals.
- `app/main.js` and `app/style.css` — routing, shared state and styling.
- `screenshots/` — desktop captures of the running site.
- `main.ts` — validates and bundles the site.
- `vendor/makefun-frontend.ts` — the make.fun dossier library, unchanged

The household, its people and its figures are a worked example written for this site; the arithmetic is real throughout.
