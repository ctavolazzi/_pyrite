#!/usr/bin/env node
/**
 * Checks that the four headline stat tiles equal the totals in /api/repos.
 *
 *   node tests/tile-totals.mjs        # 5 loads, default
 *   node tests/tile-totals.mjs 10     # 10 loads
 *
 * Exits non-zero if any load disagrees with the API, or if loads disagree
 * with each other.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS USES PLAYWRIGHT AND NOT `chrome --dump-dom`
 *
 * The tiles are painted by animateNumber() in public/app.js, which tweens
 * from the old value to the new one across 20 requestAnimationFrame steps and
 * only assigns the exact target on the final step.
 *
 * `chrome --headless --dump-dom --virtual-time-budget=N` does NOT drive
 * requestAnimationFrame with virtual time. The tween stalls part-way and the
 * dumped DOM contains a frozen intermediate value. Six such dumps produced
 * 2/95/417/44, 1/86/375/39, 0/0/0/0, 1/38/167/17, 0/29/125/13 and 0/19/84/9
 * against a ground truth of 3/191/838/87, and that spread was mistaken for a
 * race in the dashboard (WE-260730-k0j9). It was not. Loading the same page
 * in a real browser and reading the tiles at 0, 250, 500, 1000, 2000 and
 * 4000ms gives the correct totals at every single sample.
 *
 * The rule: a value produced by a rAF animation cannot be measured by a DOM
 * dump. Drive a real browser and wait real wall-clock time.
 * ---------------------------------------------------------------------------
 */

import { chromium } from 'playwright';

const URL = process.env.DASH_URL || 'http://localhost:3848';
const LOADS = Number(process.argv[2] || 5);
const KEYS = ['repositories', 'workEfforts', 'tickets', 'active'];
const IDS = ['statRepos', 'statWorkEfforts', 'statTickets', 'statActive'];

async function groundTruth() {
  const res = await fetch(`${URL}/api/repos`);
  const { repos } = await res.json();
  const names = Object.keys(repos);
  let workEfforts = 0;
  let tickets = 0;
  let active = 0;
  for (const name of names) {
    const wes = repos[name].workEfforts || [];
    workEfforts += wes.length;
    for (const we of wes) {
      tickets += (we.tickets || []).length;
      if (we.status === 'active' || we.status === 'in_progress') active += 1;
    }
  }
  return { repositories: names.length, workEfforts, tickets, active };
}

const truth = await groundTruth();
console.log(
  `ground truth: ${truth.repositories} repos, ${truth.workEfforts} work efforts, ` +
    `${truth.tickets} tickets, ${truth.active} active\n`
);

// channel:'chrome' drives the Google Chrome already installed on the machine,
// so this check does not require `npx playwright install` and its ~100MB of
// browser binaries. Falls back to a bundled build if Chrome is absent.
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome' });
} catch {
  browser = await chromium.launch();
}

const seen = new Map();
let mismatches = 0;

for (let i = 1; i <= LOADS; i += 1) {
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  // Longer than animateNumber's 300ms tween, so a settled value is read
  // rather than a frame of the animation.
  await page.waitForTimeout(800);

  const values = await page.evaluate(
    (ids) => ids.map((id) => Number(document.getElementById(id)?.textContent?.trim())),
    IDS
  );
  await page.close();

  const tiles = Object.fromEntries(KEYS.map((k, idx) => [k, values[idx]]));
  seen.set(JSON.stringify(tiles), (seen.get(JSON.stringify(tiles)) || 0) + 1);

  const bad = KEYS.filter((k) => tiles[k] !== truth[k]);
  if (bad.length) mismatches += 1;
  console.log(
    `  load ${String(i).padStart(2)}  ${bad.length ? 'MISMATCH' : 'ok      '}  ` +
      KEYS.map((k) => tiles[k]).join('/') +
      (bad.length ? `   wrong: ${bad.join(', ')}` : '')
  );
}

await browser.close();

console.log(`\ndistinct results across ${LOADS} loads: ${seen.size}`);
console.log(`loads disagreeing with the API: ${mismatches}/${LOADS}`);

if (mismatches > 0) {
  console.log('\nVERDICT: tiles do not match ground truth.');
  process.exit(1);
}
if (seen.size > 1) {
  console.log('\nVERDICT: tiles matched but were not stable. Treat as a fail.');
  process.exit(1);
}
console.log('\nVERDICT: every load matched ground truth exactly.');
