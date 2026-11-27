[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/Cxyying/household-budget-site/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/Cxyying/household-budget-site/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

# HomeLedger — Household Budget

**▶ Open it online: [cxyying.github.io/household-budget-site/app](https://cxyying.github.io/household-budget-site/app/)** — no install, runs right in your browser, even offline.

A static household budget site holding one family's November 2026 books. The overview shows the month at a glance — money in, spent so far, sent to savings and what is left — with every spending category drawn against its budget (the one category over budget is flagged, not hidden), a 50/30/20 check, the next bills coming due and the latest transactions.

The budget planner lets you edit any category's budget and watch every total move; the transactions page filters and searches the month's spending and can add a new entry; the bills page lists what is due and when; the goals page tracks savings goals with progress and the month each one is reached at its current pace. Every figure on every page is computed in the browser from the household's own records — change a number and the whole book agrees.

## Run it

```sh
node serve.ts
```

then open http://localhost:8080 in a browser. There is no build or install step: the site is the plain static files under `app/`, and it loads nothing over the network.

To produce the hand-in bundle (the site, its screenshots and `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `app/` — the site itself: `data.js` (the household's records), `budget.js` (every computation: totals, category rollups, the 50/30/20 check, bill dates, goal projections), `money.js` (money, percent and date formatting), `views.js` (the five pages), `main.js` (routing and shared state), `style.css` (the design)
- `screenshots/` — real renders of the site running, desktop and phone
- `main.ts` — the entrypoint that validates and hands in the site
- `vendor/makefun-frontend.ts` — the make.fun dossier library, unchanged

The household, its people and its figures are a worked example written for this site; the arithmetic is real throughout.
