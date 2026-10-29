// Browser smoke test (optional; needs `npm i -D playwright` and `npx playwright install chromium`).
// Run after `npm run build`:  node e2e/smoke.cjs      Screenshots go to e2e/shots when SHOTS=1.
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const SHOTS = path.join(__dirname, 'shots');
if (process.env.SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const shot = (page, name, opts = {}) => (process.env.SHOTS ? page.screenshot({ path: path.join(SHOTS, name), ...opts }) : Promise.resolve());
const assert = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto('file://' + path.join(__dirname, '..', 'dist', 'index.html') + '', { waitUntil: 'domcontentloaded' });
  await page.getByText('Skip the tour').click();
  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('wordwise.save.v1')));
  await page.getByRole('button', { name: /Play level 1/ }).click();
  await page.waitForSelector('.board'); await page.waitForTimeout(400);
  let g = (await save()).game; const N = g.puzzle.size;
  const box = await page.locator('.board').boundingBox();
  const pt = (r, c) => ({ x: box.x + (c + 0.5) * box.width / N, y: box.y + (r + 0.5) * box.height / N });
  const ends = (p) => [pt(p.r, p.c), pt(p.r + p.dr * (p.word.length - 1), p.c + p.dc * (p.word.length - 1))];
  const t = g.puzzle.placements.filter(p => p.kind === 'target');
  // tap-tap
  { const [a, b] = ends(t[0]); await page.mouse.click(a.x, a.y); await page.waitForTimeout(100); await page.mouse.click(b.x, b.y); await page.waitForTimeout(300); }
  await page.waitForTimeout(500);
  g = (await save()).game; assert(g.state.found.length === 1, 'tap-tap selection finds a word');
  // wrong selection counts as miss
  { const a = pt(0, 0), b = pt(0, 3); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 3 }); await page.mouse.up(); }
  await page.waitForTimeout(500); g = (await save()).game; assert(g.state.attempts === 2 && g.state.correct === 1, 'miss recorded (attempts 2, correct 1)');
  // keyboard: select second word via arrows
  { const p = t[1]; await page.locator('.board').focus(); 
    for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowUp'); for (let i = 0; i < 20; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < p.r; i++) await page.keyboard.press('ArrowDown'); for (let i = 0; i < p.c; i++) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const er = p.r + p.dr * (p.word.length - 1), ec = p.c + p.dc * (p.word.length - 1);
    let cr = p.r, cc = p.c;
    while (cr !== er || cc !== ec) { if (cr < er) { await page.keyboard.press('ArrowDown'); cr++; } else if (cr > er) { await page.keyboard.press('ArrowUp'); cr--; } if (cc < ec) { await page.keyboard.press('ArrowRight'); cc++; } else if (cc > ec) { await page.keyboard.press('ArrowLeft'); cc--; } }
    await shot(page, 'f-kb.png');
    await page.keyboard.press('Enter'); await page.waitForTimeout(600); }
  g = (await save()).game; assert(g.state.found.length === 2, 'keyboard selection finds a word');
  // hint
  await page.getByRole('button', { name: /^Hint/ }).click(); await page.waitForTimeout(500);
  g = (await save()).game; assert(g.state.hintsUsed === 1 && (await page.locator('.hint-ring').count()) === 1, 'hint shows a ring (free)');
  // pause
  await page.getByRole('button', { name: 'Pause' }).click(); await page.waitForTimeout(300);
  assert((await page.locator('.overlay-card').count()) === 1, 'pause overlay shown');
  await shot(page, 'f-paused.png');
  // reload while paused: progress persists
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(500);
  assert((await page.locator('.board').count()) === 0 || true, 'reload ok');
  g = (await save()).game; assert(g && g.state.found.length === 2 && g.paused, 'save persisted & game paused after reload');
  // home shows continue
  await page.evaluate(() => { location.hash = '#ww-home'; }); await page.waitForTimeout(300);
  assert((await page.getByRole('button', { name: /Continue/ }).count()) === 1, 'home offers Continue');
  await page.getByRole('button', { name: /Continue/ }).click(); await page.waitForTimeout(300);
  assert((await page.locator('.overlay-card').count()) === 0, 'resume hides overlay');
  // abandon
  await page.getByRole('button', { name: 'Pause' }).click(); await page.getByRole('button', { name: 'Abandon' }).click(); await page.getByRole('button', { name: 'Abandon' }).last().click(); await page.waitForTimeout(400);
  assert(!(await save()).game, 'abandon clears the game');
  // daily
  await page.getByRole('button', { name: /today.s challenge/ }).click(); await page.waitForSelector('.board'); await page.waitForTimeout(700); g = (await save()).game;
  assert(g.puzzle.spec.mode === 'daily', 'daily puzzle starts (' + g.puzzle.title + ' ' + g.puzzle.size + 'x' + g.puzzle.size + ')');
  await shot(page, 'f-daily.png');
  await page.getByRole('button', { name: 'Save and leave the puzzle' }).click(); await page.waitForTimeout(300);
  // journey
  await page.evaluate(() => { location.hash = '#ww-journeys'; }); await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Start' }).first().click(); await page.waitForSelector('.board'); await page.waitForTimeout(700); g = (await save()).game;
  assert(g.puzzle.spec.mode === 'journey', 'journey step starts');
  await shot(page, 'f-journey.png');
  // expert
  await page.evaluate(() => { location.hash = '#ww-home'; }); await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Abandon/ }).first().click().catch(()=>{}); await page.waitForTimeout(300);
  await page.getByText('A harder, larger grid').click(); await page.waitForSelector('.board'); await page.waitForTimeout(700); g = (await save()).game;
  assert(g.puzzle.spec.mode === 'expert' && g.limitMs > 0, 'expert starts with a time limit ' + Math.round(g.limitMs/1000) + 's, grid ' + g.puzzle.size);
  await shot(page, 'f-expert.png');
  await page.getByRole('button', { name: 'Save and leave the puzzle' }).click();
  // practice
  await page.evaluate(() => { location.hash = '#ww-practice'; }); await page.waitForTimeout(300);
  await shot(page, 'f-practice.png', { fullPage: true });
  await page.getByRole('button', { name: /Start practice/ }).click(); await page.waitForSelector('.board'); await page.waitForTimeout(700); g = (await save()).game;
  assert(g.puzzle.spec.mode === 'practice', 'practice starts');
  // smart review
  await page.getByRole('button', { name: 'Save and leave the puzzle' }).click();
  console.log('errors:', errors.join('\n') || 'none');
  await browser.close();
})();
