// All Flagsmith access goes through this file, so the experiment wiring sits in one place.
//
// Flags used:
//   dashboard_variant  : multivariate EXPERIMENT flag. Value "control" = list view (A), "grouped" = grouped view (B).
//                        It is locked while the experiment runs, so the kill switch and config are separate flags.
//                        Current experiment: #795 (v3, Production, started 2026-11-26 21:46 UTC).
//                        #595 and #610 were ended because variant B changed; their data isn't used.
//   quietops_enabled : kill switch. If it's off, the game shows a maintenance screen.
//   game_config        : remote config (JSON string), e.g. {"timerSeconds":60,"introText":"..."}
//
// Events (names are case-sensitive and must match the Flagsmith metrics exactly):
//   incident_resolved_correctly   : primary metric
//   incident_resolved_incorrectly : secondary
//   incident_timed_out            : guardrail
import flagsmith from '@flagsmith/flagsmith';

export const EXPERIMENT_FLAG = 'dashboard_variant';
export const KILL_SWITCH_FLAG = 'quietops_enabled';
export const CONFIG_FLAG = 'game_config';

export const EVENTS = {
  CORRECT: 'incident_resolved_correctly',
  INCORRECT: 'incident_resolved_incorrectly',
  TIMED_OUT: 'incident_timed_out',
};

export const DEFAULT_CONFIG = {
  timerSeconds: 60,
  introText: 'Production is down. Find the root cause. You have 60 seconds.',
};

const ENV_KEY = import.meta.env.VITE_FLAGSMITH_ENV_KEY;
const PLAYER_ID_KEY = 'quietops_player_id';

let ready = false;
let memoryPlayerId = null; // used when localStorage is blocked (private mode, etc.)

function randomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

// Stable anonymous ID. The same ID is used for the exposure and the conversion events.
export function getPlayerId() {
  try {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = `player_${randomId()}`;
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    if (!memoryPlayerId) memoryPlayerId = `player_${randomId()}`;
    return memoryPlayerId;
  }
}

// Initialise the SDK and identify the player in one step. Passing `identity` to init
// means the first flag fetch is already the identity's flags, so we never read the
// experiment flag before identifying.
export async function initFlagsmith() {
  if (!ENV_KEY) {
    console.warn('[QuietOps] VITE_FLAGSMITH_ENV_KEY not set; using defaults (no experiment).');
    return false;
  }
  try {
    await flagsmith.init({
      environmentID: ENV_KEY,
      identity: getPlayerId(),
      enableEvents: true,
    });
    ready = true;
    // Send buffered events if the tab is closed or hidden (mobile browsers often just hide it).
    const flush = () => flagsmith.flushEvents().catch(() => {});
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    return true;
  } catch (err) {
    console.error('[QuietOps] Flagsmith init failed; using defaults.', err);
    return false;
  }
}

export function isGameEnabled() {
  if (!ready) return true; // fail open: if Flagsmith is unreachable, the game still works
  return flagsmith.hasFeature(KILL_SWITCH_FLAG, { fallback: true });
}

export function getGameConfig() {
  if (!ready) return DEFAULT_CONFIG;
  const raw = flagsmith.getValue(CONFIG_FLAG, { json: true, fallback: {} });
  return { ...DEFAULT_CONFIG, ...(raw && typeof raw === 'object' ? raw : {}) };
}

// Call ONLY when the dashboard is actually shown. Returns "control" or "grouped".
//   recordExposure = true  -> getExperimentFlag: records the exposure (player's counted round)
//   recordExposure = false -> getValue: same assigned variant, NO exposure (replays). Otherwise
//                             returning players would log exposures that can never convert,
//                             diluting both arms. (Verified in SDK source: only getExperimentFlag
//                             calls trackExposureEvent.)
export function getDashboardVariant({ recordExposure }) {
  // Local dev only (compiled out of production builds): ?variant=grouped forces a view.
  // It records no exposure.
  if (import.meta.env.DEV) {
    const forced = new URLSearchParams(window.location.search).get('variant');
    if (forced === 'grouped' || forced === 'control') return forced;
  }
  if (!ready) return 'control';
  const value = recordExposure
    ? flagsmith.getExperimentFlag(EXPERIMENT_FLAG)?.value
    : flagsmith.getValue(EXPERIMENT_FLAG);
  return value === 'grouped' ? 'grouped' : 'control';
}

// Only a player's FIRST round counts toward the experiment. Replaying the same incident is
// easier because you already know the answer, which would inflate both variants and blur the
// difference. Marked at round start (the same moment as the exposure), so a player who
// abandons round 1 still counts as "not resolved".
const ROUNDS_KEY = 'quietops_rounds_started';
let memoryRounds = 0;

export function startRound() {
  let previous = memoryRounds;
  try {
    previous = Number(localStorage.getItem(ROUNDS_KEY) ?? 0);
    localStorage.setItem(ROUNDS_KEY, String(previous + 1));
  } catch {
    // localStorage blocked: fall back to counting in memory for this page load
  }
  memoryRounds = previous + 1;
  return { round: previous + 1, counted: previous === 0 };
}

// value: a number the metric can aggregate (we send seconds taken).
export function track(event, { value, metadata } = {}) {
  if (!ready) return;
  flagsmith.trackEvent(event, { value, metadata });
  // Flush right away. The game ends on a single event, and players often close the tab straight after.
  flagsmith.flushEvents().catch(() => {});
}
