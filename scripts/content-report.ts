/**
 * Prints a summary of the vocabulary library: sizes, difficulty mix, review status and the
 * reference works each category should be checked against. Run: npm run content:report
 */
import { getCategories } from '../src/content';

const pad = (s: string | number, n: number) => String(s).padEnd(n);
let total = 0;
let verified = 0;
console.log(`${pad('Category', 38)}${pad('Words', 7)}${pad('Topics', 8)}${pad('Diff 1-5', 20)}${pad('Len', 8)}Reviewed`);
console.log('-'.repeat(88));
for (const c of getCategories()) {
  const diff = [0, 0, 0, 0, 0];
  let min = 99;
  let max = 0;
  let ok = 0;
  for (const e of c.entries) {
    diff[e.difficulty - 1]++;
    min = Math.min(min, e.word.length);
    max = Math.max(max, e.word.length);
    if (e.status === 'verified') ok++;
  }
  total += c.entries.length;
  verified += ok;
  console.log(`${pad(c.name, 38)}${pad(c.entries.length, 7)}${pad(c.topics.length, 8)}${pad(diff.join('/'), 20)}${pad(`${min}-${max}`, 8)}${ok}/${c.entries.length}`);
}
console.log('-'.repeat(88));
console.log(`${total} entries, ${verified} human-verified, ${total - verified} awaiting editorial review.\n`);
console.log('Recommended references for review:');
for (const c of getCategories()) {
  console.log(`\n${c.name}`);
  for (const r of c.references) console.log(`  - ${r}`);
}
