import type { PoolEntry } from '../src/engine';

const RAW: Array<[string, number, string]> = [
  ['Inflation', 2, 'a'], ['Liquidity', 3, 'a'], ['Diversification', 4, 'a'], ['Depreciation', 3, 'a'],
  ['Equity', 2, 'a'], ['Liability', 2, 'a'], ['Budget', 1, 'a'], ['Dividend', 2, 'a'], ['Portfolio', 2, 'a'],
  ['Amortization', 4, 'b'], ['Collateral', 3, 'b'], ['Mortgage', 2, 'b'], ['Solvency', 3, 'b'], ['Recession', 2, 'b'],
  ['Deflation', 3, 'b'], ['Tariff', 2, 'b'], ['Subsidy', 3, 'b'], ['Monopoly', 2, 'b'], ['Elasticity', 4, 'b'],
  ['Stagflation', 4, 'c'], ['Annuity', 3, 'c'], ['Principal', 2, 'c'], ['Overdraft', 2, 'c'], ['Insolvency', 4, 'c'],
  ['Yield', 2, 'c'], ['Asset', 1, 'c'], ['Credit', 1, 'c'], ['Interest', 1, 'c'], ['Currency', 1, 'c'],
  ['Revenue', 1, 'a'], ['Margin', 2, 'b'], ['Profit', 1, 'c'], ['Capital', 2, 'a'], ['Auction', 2, 'b'],
  ['Barter', 2, 'c'], ['Commodity', 3, 'a'], ['Derivative', 4, 'b'], ['Hedge', 3, 'c'], ['Inventory', 2, 'a'],
  ['Wealth', 1, 'b'], ['Income', 1, 'c'], ['Expense', 1, 'a'], ['Audit', 2, 'b'], ['Ledger', 3, 'c'],
  ['Pension', 2, 'a'], ['Premium', 2, 'b'], ['Deductible', 3, 'c'], ['Appraisal', 3, 'a'], ['Escrow', 4, 'b'],
  ['Fiduciary', 5, 'c'], ['Arbitrage', 5, 'a'], ['Leverage', 3, 'b'], ['Volatility', 4, 'c'], ['Benchmark', 3, 'a'],
  ['Bankruptcy', 3, 'b'], ['Foreclosure', 4, 'c'], ['Taxation', 2, 'a'], ['Deficit', 2, 'b'], ['Surplus', 2, 'c'],
  ['Mutual', 2, 'a'], ['Brokerage', 3, 'b'], ['Underwriting', 5, 'c'], ['Securities', 4, 'a'], ['Bonds', 1, 'b'],
  ['Shares', 1, 'c'], ['Stock', 1, 'a'], ['Option', 2, 'b'], ['Futures', 3, 'c'], ['Rating', 2, 'a'],
];

export const POOL: PoolEntry[] = RAW.map(([term, difficulty, topic]) => ({
  id: `t-${term.toLowerCase()}`,
  term,
  word: term.toUpperCase(),
  difficulty,
  topic,
  clue: `Definition of ${term}.`,
}));
