// Traffic simulator: fake players for the DEVELOPMENT environment only.
//
// What it's for: showing the whole pipeline working (flag split -> exposure -> events ->
// Flagsmith results) in the demo, and checking the wiring without waiting for real players.
// What it's NOT for: the real result. Simulated players never touch Production, and the
// outcome rates below are assumptions we typed in, so a simulated "winner" proves nothing.
//
// Each fake player does exactly what the game does on a counted round:
//   1. identify with a fresh anonymous id
//   2. read dashboard_variant with getExperimentFlag (this records the exposure)
//   3. "play": pick an outcome using the assumed rates for that variant
//   4. send ONE event (same names as the game) with the seconds taken as its value, then flush
//
// Usage:
//   npm run simulate                      # 200 players
//   npm run simulate -- --players 50 --concurrency 5
// Reads VITE_FLAGSMITH_ENV_KEY from .env.local (the Development key). Refuses the Production key.
import { createFlagsmithInstance } from '@flagsmith/flagsmith/isomorphic';

const PRODUCTION_KEY = 'bwLu5Dz3bc9NU3Saqwi9h6'; // public client key of the live site
const FLAG = 'dashboard_variant';
const EVENTS = {
  found: 'incident_resolved_correctly',
  wrong: 'incident_resolved_incorrectly',
  timedOut: 'incident_timed_out',
};
const TIMER_SECONDS = 60;

// ASSUMED outcome rates and timings (made up for the simulation, not measured).
const ASSUMED = {
  control: { found: 0.4, wrong: 0.45, secondsMean: 38, secondsSd: 10 },
  grouped: { found: 0.62, wrong: 0.28, secondsMean: 28, secondsSd: 8 },
};

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? Number(process.argv[i + 1]) : fallback;
}
const PLAYERS = arg('players', 200);
const CONCURRENCY = arg('concurrency', 8);

const key = process.env.VITE_FLAGSMITH_ENV_KEY;
if (!key) {
  console.error('VITE_FLAGSMITH_ENV_KEY missing. Run with: npm run simulate (reads .env.local)');
  process.exit(1);
}
if (key === PRODUCTION_KEY) {
  console.error('Refusing to run: that is the PRODUCTION key. Simulated players must never reach the real experiment.');
  process.exit(1);
}

// Normal-ish random number (Box-Muller), clamped to the timer.
function seconds(mean, sd) {
  const z = Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  return Math.max(4, Math.min(TIMER_SECONDS, Math.round(mean + z * sd)));
}

const run = Date.now().toString(36);
const tally = { control: { n: 0, found: 0, wrong: 0, timedOut: 0 }, grouped: { n: 0, found: 0, wrong: 0, timedOut: 0 } };
let notEnrolled = 0;

async function playOne(i) {
  const flagsmith = createFlagsmithInstance();
  await flagsmith.init({ environmentID: key, identity: `sim-${run}-${i}`, enableEvents: true });

  const variant = flagsmith.getExperimentFlag(FLAG)?.value;
  if (variant !== 'control' && variant !== 'grouped') {
    notEnrolled++; // no running experiment on this environment, or player outside it
    return;
  }

  const r = ASSUMED[variant];
  const roll = Math.random();
  const outcome = roll < r.found ? 'found' : roll < r.found + r.wrong ? 'wrong' : 'timedOut';
  const secs = outcome === 'timedOut' ? TIMER_SECONDS : seconds(r.secondsMean, r.secondsSd);

  flagsmith.trackEvent(EVENTS[outcome], { value: secs, metadata: { variant, seconds: secs, simulated: true } });
  await flagsmith.flushEvents();

  const t = tally[variant];
  t.n++;
  t[outcome]++;
}

console.log(`Simulating ${PLAYERS} players on the Development environment (run ${run})...`);
let next = 0;
let failed = 0;
async function worker() {
  while (next < PLAYERS) {
    const i = next++;
    await playOne(i).catch((e) => {
      failed++;
      if (failed <= 3) console.warn(`player ${i} failed: ${e.message}`);
    });
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${PLAYERS}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '-');
console.log('\nSent (simulated, assumed rates):');
for (const [v, t] of Object.entries(tally)) {
  console.log(`  ${v.padEnd(8)} ${String(t.n).padStart(4)} players · found ${pct(t.found, t.n)} · wrong ${pct(t.wrong, t.n)} · timed out ${pct(t.timedOut, t.n)}`);
}
if (notEnrolled) console.log(`  ${notEnrolled} not enrolled (is an experiment running on this environment?)`);
if (failed) console.log(`  ${failed} failed`);
console.log('\nFlagsmith results update a few minutes after events arrive.');
