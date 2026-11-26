// One-off: send a single test event so Flagsmith's warehouse starts processing.
// Usage: node --env-file=.env.local scripts/send-test-event.mjs
import flagsmith from '@flagsmith/flagsmith/isomorphic';

const key = process.env.VITE_FLAGSMITH_ENV_KEY;
if (!key) throw new Error('VITE_FLAGSMITH_ENV_KEY missing');

await flagsmith.init({ environmentID: key, identity: 'warehouse_test_player', enableEvents: true });
flagsmith.trackEvent('warehouse_test', { metadata: { source: 'setup-script' } });
await flagsmith.flushEvents();
console.log('Sent warehouse_test event. Flags seen:', Object.keys(flagsmith.getAllFlags()));
