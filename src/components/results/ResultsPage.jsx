// Public live results page: /results
// Reads /api/results (a Vercel function that holds the Flagsmith admin key server-side)
// and refreshes every minute. Not linked from the game before a player answers, so it
// can't influence a counted round.
import { useEffect, useMemo, useState } from 'react';
import { probabilityBBeatsA, rate, pct } from '../../lib/stats.js';
import './results.css';

const VERSIONS = [
  { key: 'control', label: 'List view', sub: 'chronological feed' },
  { key: 'grouped', label: 'Grouped view', sub: 'incident + blast radius' },
];
const OUTCOMES = [
  { key: 'found', label: 'Found the root cause' },
  { key: 'wrong', label: 'Picked the wrong service' },
  { key: 'timedOut', label: 'Ran out of time' },
];
const POLL_MS = 60_000;

// The decision rule, written down on 2026-11-26 BEFORE any v3 results existed
// (docs/designs/winning-plan.md). The page applies it live so anyone can check the call.
const RULE = {
  decideAt: 'Sat Nov 28, 2 PM PT',
  minPerVersion: 30, // fewer than this per version at the deadline = inconclusive
  win: 0.8, // chance grouped is better >= 80% -> grouped wins (if the guardrail holds)
  lose: 0.2, // <= 20% -> the list wins
  maxExtraWrong: 0.1, // guardrail: grouped's wrong-call rate may be at most 10 points higher
};
const TARGET_PER_VERSION = RULE.minPerVersion;

async function loadResults() {
  const res = await fetch('/api/results', { headers: { Accept: 'application/json' } });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  if (res.ok && isJson) return res.json();
  // Local dev has no serverless functions: fall back to a git-ignored fixture.
  if (import.meta.env.DEV) {
    const dev = await fetch('/dev-results.json');
    if (dev.ok) return dev.json();
  }
  const body = isJson ? await res.json().catch(() => ({})) : {};
  throw new Error(body.error || `HTTP ${res.status}`);
}

function timeAgo(iso) {
  if (!iso) return 'unknown';
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} h ago`;
}

export default function ResultsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    const tick = () =>
      loadResults()
        .then((d) => alive && (setData(d), setError(null)))
        .catch((e) => alive && setError(e.message));
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (error && !data) {
    return (
      <main className="center">
        <h1>Results aren't connected yet</h1>
        <p className="muted">
          {error === 'not_configured' ? 'The results key hasn’t been added on the server.' : `Couldn't load results (${error}).`}
        </p>
      </main>
    );
  }
  if (!data) return <main className="center muted">Loading results…</main>;
  return <Results data={data} />;
}

function Results({ data }) {
  const { control: a, grouped: b } = data.variants;
  const total = a.exposed + b.exposed;
  const localProb = useMemo(
    () => probabilityBBeatsA(a.found, a.exposed, b.found, b.exposed),
    [a.found, a.exposed, b.found, b.exposed]
  );
  // Flagsmith's own number when it has one; until then, our estimate from the same counts.
  const fromFlagsmith = data.flagsmithChance != null;
  const winProb = fromFlagsmith ? data.flagsmithChance : localProb;
  const avgSeconds = (v) => (v.found ? Math.round(v.secondsSum / v.found) : null);
  const early = Math.min(a.exposed, b.exposed) < TARGET_PER_VERSION;
  const running = data.experiment.status === 'running';

  return (
    <div className="results viz-root">
      <header className="results-top">
        <span className="brand">
          <span className="logo-dot" aria-hidden="true" /> QuietOps
        </span>
        <span className={`status-pill ${running ? '' : 'done'}`}>
          {running && <span className="pulse-dot" aria-hidden="true" />}
          {running ? 'Experiment live' : 'Experiment finished'}
        </span>
        <span className="results-updated">Updated {timeAgo(data.asOf)}</span>
      </header>

      <main className="results-main">
        <h1 className="results-title">Do grouped alerts help engineers find the root cause?</h1>
        <p className="results-hypothesis">{data.experiment.hypothesis}</p>

        <Decision data={data} winProb={winProb} />
        {data.rollout && <Rollout rollout={data.rollout} />}

        {total === 0 ? (
          <section className="panel empty">No players yet. Results appear here as people play.</section>
        ) : (
          <>
            <section className="tiles" aria-label="Headline results">
              {VERSIONS.map((v) => {
                const s = data.variants[v.key];
                return (
                  <div key={v.key} className="tile">
                    <div className="tile-label">
                      <span className={`swatch swatch-${v.key}`} aria-hidden="true" /> {v.label}
                    </div>
                    <div className="tile-value">{pct(rate(s.found, s.exposed))}</div>
                    <div className="tile-sub">
                      found the root cause · {s.found}/{s.exposed} players
                    </div>
                  </div>
                );
              })}
              <div className="tile tile-win">
                <div className="tile-label">Chance grouped is better</div>
                <div className="tile-value">{winProb == null ? '–' : pct(winProb)}</div>
                <div className="tile-sub">
                  {fromFlagsmith ? "Flagsmith's chance to win (found root cause)" : 'Bayesian estimate from the counts above'}
                </div>
              </div>
            </section>

            {early && (
              <p className="notice" role="note">
                Early data: {a.exposed} vs {b.exposed} players. The rule needs at least {TARGET_PER_VERSION} per version.
              </p>
            )}

            <OutcomeChart variants={data.variants} />

            <section className="panel">
              <header className="panel-head">
                <h2>All numbers</h2>
                <span className="panel-meta">from Flagsmith experiment #{data.experiment.id}</span>
              </header>
              <div className="table-wrap">
                <table className="numbers">
                  <thead>
                    <tr>
                      <th scope="col">Version</th>
                      <th scope="col">Players</th>
                      <th scope="col">Found root cause</th>
                      <th scope="col">Wrong service</th>
                      <th scope="col">Timed out</th>
                      <th scope="col">Avg time to correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VERSIONS.map((v) => {
                      const s = data.variants[v.key];
                      const avg = avgSeconds(s);
                      return (
                        <tr key={v.key}>
                          <th scope="row">{v.label}</th>
                          <td>{s.exposed}</td>
                          <td>{s.found} ({pct(rate(s.found, s.exposed))})</td>
                          <td>{s.wrong} ({pct(rate(s.wrong, s.exposed))})</td>
                          <td>{s.timedOut} ({pct(rate(s.timedOut, s.exposed))})</td>
                          <td>{avg == null ? '–' : `${avg}s`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <section className="method">
          <h2>How this works</h2>
          <ul>
            <li>
              Flagsmith randomly assigns each anonymous player to the <strong>list</strong> or <strong>grouped</strong>{' '}
              dashboard (50/50) with the <code>dashboard_variant</code> flag.
            </li>
            <li>Only a player's first round counts. Replays are easier once you know the answer.</li>
            <li>
              Outcomes are real events sent from the game: <code>incident_resolved_correctly</code>,{' '}
              <code>incident_resolved_incorrectly</code>, <code>incident_timed_out</code>.
            </li>
            <li>
              "Players" counts everyone who saw a dashboard, so the three outcomes don't always add up to it. Some
              players close the tab without answering.
            </li>
          </ul>
          <a className="play-link" href="/">Play the game →</a>
        </section>
      </main>
    </div>
  );
}

// Where the data stands under the pre-registered rule, in plain English, plus the rule itself,
// player progress and a check that Flagsmith really is splitting players 50/50.
function verdict(data, winProb) {
  const { control: a, grouped: b } = data.variants;
  const minN = Math.min(a.exposed, b.exposed);
  const finished = data.experiment.status !== 'running';
  const extraWrong = (rate(b.wrong, b.exposed) ?? 0) - (rate(a.wrong, a.exposed) ?? 0);
  const when = finished ? '' : ` Decision: ${RULE.decideAt}.`;

  if (minN < RULE.minPerVersion) {
    return {
      tone: 'pending',
      head: finished ? 'Inconclusive' : 'Not decided yet',
      body: `Needs at least ${RULE.minPerVersion} players per version (now ${a.exposed} list, ${b.exposed} grouped).${when}`,
    };
  }
  const p = pct(winProb);
  if (winProb >= RULE.win && extraWrong <= RULE.maxExtraWrong) {
    return {
      tone: 'grouped',
      head: finished ? 'Grouped wins' : 'Grouped is ahead',
      body: `${p} chance grouped is better, and it doesn't cause more wrong calls.${finished ? '' : ' If this holds at the deadline, grouped gets rolled out.'}${when}`,
    };
  }
  if (winProb >= RULE.win) {
    return {
      tone: 'pending',
      head: finished ? 'Inconclusive' : 'Not a win yet',
      body: `Grouped finds the cause more often (${p}), but its wrong calls are ${Math.round(extraWrong * 100)} points higher, over the ${Math.round(RULE.maxExtraWrong * 100)}-point limit.${when}`,
    };
  }
  if (winProb <= RULE.lose) {
    return {
      tone: 'control',
      head: finished ? 'The list wins' : 'The list is ahead',
      body: `Only ${p} chance grouped is better.${finished ? '' : ' If this holds, the list stays.'}${when}`,
    };
  }
  return {
    tone: 'pending',
    head: finished ? 'Inconclusive' : 'Too close to call',
    body: `${p} chance grouped is better: between the ${Math.round(RULE.lose * 100)}% and ${Math.round(RULE.win * 100)}% lines.${when}`,
  };
}

function Decision({ data, winProb }) {
  const { control: a, grouped: b } = data.variants;
  const total = a.exposed + b.exposed;
  const goal = RULE.minPerVersion * 2;
  const v = verdict(data, winProb);
  const srm = data.srmPValue;

  return (
    <section className={`panel decision tone-${v.tone}`} aria-label="Decision">
      <div className="decision-verdict">
        <div className="decision-head">{v.head}</div>
        <p className="decision-body">{v.body}</p>
        {total > 0 && (
          <p className="decision-rates">
            Found the root cause: grouped {pct(rate(b.found, b.exposed))} · list {pct(rate(a.found, a.exposed))}
          </p>
        )}
      </div>

      <div className="decision-progress">
        <div className="progress-label">
          <span>Players so far</span>
          <span className="progress-count">
            {total} / {goal}
          </span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={total}>
          <div className="progress-fill" style={{ width: `${Math.min(100, (total / goal) * 100)}%` }} />
        </div>
        {srm != null && (
          <p className={`split-health ${srm < 0.01 ? 'bad' : ''}`}>
            {srm < 0.01
              ? `Warning: players aren't splitting 50/50 as expected (p = ${srm.toFixed(3)}). Results may be biased.`
              : '50/50 split looks healthy (sample ratio check passed).'}
          </p>
        )}
      </div>

      <details className="decision-rule">
        <summary>The decision rule (written before any results came in)</summary>
        <ul>
          <li>
            Decided on <strong>{RULE.decideAt}</strong>, on the primary metric: did the player find the root cause.
          </li>
          <li>
            <strong>Grouped wins</strong> if there's at least an {Math.round(RULE.win * 100)}% chance it's better{' '}
            <em>and</em> its wrong-call rate isn't more than {Math.round(RULE.maxExtraWrong * 100)} points higher.
            Then it's rolled out 10% → 50% → 100% with the same flag.
          </li>
          <li>
            <strong>The list wins</strong> if that chance is {Math.round(RULE.lose * 100)}% or less.
          </li>
          <li>
            Anything in between, or fewer than {RULE.minPerVersion} players per version, is <strong>inconclusive</strong>:
            the list stays, and we say so.
          </li>
          <li>
            Why 80% and not 95%: this is a layout change behind a flag with a kill switch. Being wrong costs little and
            is undone in seconds, so we accept more risk in exchange for a decision with a hackathon-sized sample.
          </li>
          <li>
            "Chance grouped is better" is Flagsmith's own chance-to-win once it reports one; until then it's a
            Bayesian estimate from the same counts.
          </li>
        </ul>
      </details>
    </section>
  );
}

function Rollout({ rollout }) {
  const steps = [10, 50, 100];
  const now = rollout.enabled ? rollout.groupedPercent : 0;
  return (
    <section className="panel rollout" aria-label="Rollout">
      <header className="panel-head">
        <h2>Rollout</h2>
        <span className="panel-meta">share of players now served the grouped view, via the same flag</span>
      </header>
      <div className="rollout-steps">
        {steps.map((s) => (
          <div key={s} className={`rollout-step ${now >= s ? 'done' : ''}`}>
            <span className="rollout-pct">{s}%</span>
          </div>
        ))}
      </div>
      <p className="rollout-now">
        Grouped view: <strong>{Math.round(now)}%</strong> of players
      </p>
    </section>
  );
}

// Horizontal grouped bars: 3 outcomes × 2 versions, as % of players exposed.
// Legend + direct labels (identity is never colour-alone); hover/focus shows exact counts.
function OutcomeChart({ variants }) {
  const [hover, setHover] = useState(null);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>What players did</h2>
        <div className="legend" aria-hidden="true">
          {VERSIONS.map((v) => (
            <span key={v.key}>
              <span className={`swatch swatch-${v.key}`} /> {v.label}
            </span>
          ))}
        </div>
      </header>
      <div className="chart" role="img" aria-label="Share of players per outcome, by dashboard version. Exact numbers are in the table below.">
        {OUTCOMES.map((o) => (
          <div key={o.key} className="chart-group">
            <div className="chart-group-label">{o.label}</div>
            {VERSIONS.map((v) => {
              const s = variants[v.key];
              const r = rate(s[o.key], s.exposed);
              const id = `${o.key}-${v.key}`;
              return (
                <div
                  key={v.key}
                  className="bar-row"
                  tabIndex={0}
                  onMouseEnter={() => setHover(id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(id)}
                  onBlur={() => setHover(null)}
                >
                  <span className="bar-name">{v.label}</span>
                  <div className="bar-track">
                    <div className={`bar bar-${v.key}`} style={{ width: `${(r ?? 0) * 100}%` }} />
                    <span className="bar-value">{pct(r)}</span>
                    {hover === id && (
                      <div className="bar-tip" role="tooltip">
                        <strong>{v.label}</strong> · {o.label.toLowerCase()}
                        <br />
                        {s[o.key]} of {s.exposed} players ({pct(r)})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
