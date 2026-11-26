// Vercel serverless function: GET /api/results
//
// Reads the live experiment results from Flagsmith's Admin API and returns a small,
// public-safe JSON summary for the /results page.
//
// Why a server function: the Admin API needs an organisation API key, which must never
// reach the browser. The key lives only in Vercel's environment (FLAGSMITH_ADMIN_API_KEY).
// This function only ever calls two fixed endpoints for one experiment, so it can't be
// used to read or change anything else.
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   FLAGSMITH_ADMIN_API_KEY   secret: Flagsmith → Organisation Settings → API Keys
//   VITE_FLAGSMITH_ENV_KEY    already set; the Production environment key
//   QUIETOPS_EXPERIMENT_ID    optional; defaults to the current experiment
import { shapeResults } from './_shape.js';

const API = 'https://api.flagsmith.com/api/v1';
const DEFAULT_EXPERIMENT_ID = '610'; // "Grouped alerts vs chronological list (v2)"
const REFRESH_AFTER_MS = 5 * 60 * 1000; // Flagsmith allows one refresh per 5 minutes

export default async function handler(req, res) {
  const key = process.env.FLAGSMITH_ADMIN_API_KEY;
  const env = process.env.VITE_FLAGSMITH_ENV_KEY;
  const id = process.env.QUIETOPS_EXPERIMENT_ID || DEFAULT_EXPERIMENT_ID;

  if (!key || !env) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const headers = { Authorization: `Api-Key ${key}`, Accept: 'application/json' };
  const base = `${API}/environments/${encodeURIComponent(env)}/experiments/${encodeURIComponent(id)}`;

  try {
    const [expRes, resultsRes] = await Promise.all([
      fetch(`${base}/`, { headers }),
      fetch(`${base}/results/`, { headers }),
    ]);
    if (!expRes.ok || !resultsRes.ok) {
      res.status(502).json({ error: 'upstream', status: [expRes.status, resultsRes.status] });
      return;
    }
    const experiment = await expRes.json();
    const results = (await resultsRes.json()).results;

    // Ask Flagsmith to recompute if the numbers are stale. Fire-and-forget: the next
    // request picks up the fresh numbers. Errors (e.g. rate limit) are ignored.
    const asOf = Date.parse(results?.as_of ?? 0);
    if (!results?.is_final && Date.now() - asOf > REFRESH_AFTER_MS) {
      fetch(`${base}/results/refresh/`, { method: 'POST', headers }).catch(() => {});
    }

    // CDN-cache for a minute so many viewers don't hammer Flagsmith.
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json(shapeResults(experiment, results));
  } catch {
    res.status(502).json({ error: 'upstream' });
  }
}
