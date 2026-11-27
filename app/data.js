export const household = 'The Miller household';
export const month = 'November 2026';
export const monthKey = '2026-11';
export const today = '2026-11-27';

export const income = [
  { amount: 3400, date: '2026-11-03', id: 'inc-salary-main', name: 'Salary — Alex (main job)' },
  { amount: 1650, date: '2026-11-10', id: 'inc-salary-partner', name: 'Salary — Priya (part-time)' },
  { amount: 420, date: '2026-11-18', id: 'inc-freelance', name: 'Freelance design work' },
  { amount: 35, date: '2026-11-20', id: 'inc-interest', name: 'Bank interest and cashback' },
];

export const categories = [
  { budget: 1600, id: 'housing', kind: 'need', name: 'Housing' },
  { budget: 320, id: 'utilities', kind: 'need', name: 'Utilities & bills' },
  { budget: 650, id: 'groceries', kind: 'need', name: 'Groceries' },
  { budget: 320, id: 'transport', kind: 'need', name: 'Transport' },
  { budget: 150, id: 'health', kind: 'need', name: 'Health' },
  { budget: 160, id: 'kids', kind: 'need', name: 'Kids & school' },
  { budget: 150, id: 'dining', kind: 'want', name: 'Dining out' },
  { budget: 120, id: 'homepets', kind: 'want', name: 'Home & pets' },
  { budget: 100, id: 'fun', kind: 'want', name: 'Fun & subscriptions' },
  { budget: 80, id: 'personal', kind: 'want', name: 'Personal care' },
];

export const transactions = [
  { amount: 1550, category: 'housing', date: '2026-11-01', id: 't01', name: 'Rent' },
  { amount: 22, category: 'housing', date: '2026-11-05', id: 't02', name: 'Renters insurance' },
  { amount: 60, category: 'utilities', date: '2026-11-02', id: 't03', name: 'Internet' },
  { amount: 96, category: 'utilities', date: '2026-11-08', id: 't04', name: 'Electricity bill' },
  { amount: 85, category: 'utilities', date: '2026-11-09', id: 't05', name: 'Mobile phones (2 lines)' },
  { amount: 48, category: 'utilities', date: '2026-11-12', id: 't06', name: 'Water bill' },
  { amount: 132, category: 'groceries', date: '2026-11-02', id: 't07', name: 'Market Basket groceries' },
  { amount: 87, category: 'groceries', date: '2026-11-06', id: 't08', name: 'Green Grocer' },
  { amount: 121, category: 'groceries', date: '2026-11-13', id: 't09', name: 'Market Basket groceries' },
  { amount: 164, category: 'groceries', date: '2026-11-16', id: 't10', name: 'Costco stock-up run' },
  { amount: 74, category: 'groceries', date: '2026-11-20', id: 't11', name: 'Green Grocer' },
  { amount: 23, category: 'groceries', date: '2026-11-22', id: 't12', name: 'Bakery' },
  { amount: 70, category: 'transport', date: '2026-11-01', id: 't13', name: 'Transit passes' },
  { amount: 58, category: 'transport', date: '2026-11-04', id: 't14', name: 'Fuel' },
  { amount: 118, category: 'transport', date: '2026-11-15', id: 't15', name: 'Car insurance' },
  { amount: 52, category: 'transport', date: '2026-11-17', id: 't16', name: 'Fuel' },
  { amount: 34, category: 'health', date: '2026-11-11', id: 't17', name: 'Pharmacy' },
  { amount: 60, category: 'health', date: '2026-11-19', id: 't18', name: 'Dentist copay' },
  { amount: 85, category: 'kids', date: '2026-11-03', id: 't19', name: 'School lunches' },
  { amount: 45, category: 'kids', date: '2026-11-12', id: 't20', name: 'Soccer club fees' },
  { amount: 46, category: 'dining', date: '2026-11-07', id: 't21', name: 'Bistro lunch' },
  { amount: 12, category: 'dining', date: '2026-11-09', id: 't22', name: 'Coffee shop' },
  { amount: 88, category: 'dining', date: '2026-11-14', id: 't23', name: 'Sushi night' },
  { amount: 34, category: 'dining', date: '2026-11-21', id: 't24', name: 'Pizza night' },
  { amount: 57, category: 'homepets', date: '2026-11-08', id: 't25', name: 'Hardware store' },
  { amount: 42, category: 'homepets', date: '2026-11-18', id: 't26', name: 'Dog food' },
  { amount: 16, category: 'fun', date: '2026-11-06', id: 't27', name: 'Streaming subscription' },
  { amount: 28, category: 'fun', date: '2026-11-15', id: 't28', name: 'Cinema tickets' },
  { amount: 31, category: 'fun', date: '2026-11-20', id: 't29', name: 'Books' },
  { amount: 35, category: 'personal', date: '2026-11-13', id: 't30', name: 'Haircut' },
  { amount: 27, category: 'personal', date: '2026-11-21', id: 't31', name: 'Toiletries' },
];

export const bills = [
  { amount: 1550, dueDay: 1, id: 'b1', name: 'Rent', nextDue: '2026-12-01' },
  { amount: 60, dueDay: 2, id: 'b2', name: 'Internet', nextDue: '2026-12-02' },
  { amount: 16, dueDay: 6, id: 'b3', name: 'Streaming subscription', nextDue: '2026-12-06' },
  { amount: 96, dueDay: 8, id: 'b4', name: 'Electricity (typical)', nextDue: '2026-12-08' },
  { amount: 85, dueDay: 9, id: 'b5', name: 'Mobile phones', nextDue: '2026-12-09' },
  { amount: 118, dueDay: 15, id: 'b6', name: 'Car insurance', nextDue: '2026-12-15' },
];

export const goals = [
  {
    id: 'g1',
    monthly: 500,
    name: 'Emergency fund',
    note: 'Six months of essential spending, held in a separate savings account.',
    saved: 6400,
    target: 10000,
  },
  {
    id: 'g2',
    monthly: 250,
    name: 'Holiday trip',
    note: 'Flights and a week away next spring, booked once the fund is full.',
    saved: 1550,
    target: 2400,
  },
  {
    id: 'g3',
    monthly: 300,
    name: 'New car deposit',
    note: 'Deposit for replacing the family car.',
    saved: 1800,
    target: 6000,
  },
];

export const savingsTransfer = {
  amount: 1200,
  date: '2026-11-16',
  name: 'Transfer to savings',
};
