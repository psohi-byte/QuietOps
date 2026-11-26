// Turns Flagsmith's raw experiment + results payload into the small summary the
// /results page needs. (Files starting with "_" in /api are helpers, not endpoints.)
//
// Flagsmith returns, per metric and per variant: n (identities exposed), sum (for an
// "occurrence" metric = how many of them converted; for a "mean" metric = total value).
export const METRICS = {
  585: 'found', // incident_resolved_correctly (primary)
  586: 'wrong', // incident_resolved_incorrectly
  587: 'timedOut', // incident_timed_out
  588: 'secondsSum', // value of incident_resolved_correctly = seconds taken
};

const emptyVariant = () => ({ exposed: 0, found: 0, wrong: 0, timedOut: 0, secondsSum: 0 });

// Flagsmith's own "chance to win" for the grouped variant on one metric, as 0..1, or null
// while Flagsmith hasn't computed it yet. Read defensively: the inference block is empty
// until there's enough data, and may report percentages (0..100) or fractions.
export function groupedChanceToWin(inference) {
  const raw = inference?.chance_to_win?.grouped ?? inference?.statistics?.chance_to_win?.grouped;
  const n = Number(raw);
  if (raw == null || !Number.isFinite(n)) return null;
  return n > 1 ? n / 100 : n;
}

export function shapeResults(experiment, results, rollout = null) {
  const variants = { control: emptyVariant(), grouped: emptyVariant() };
  const inference = {};

  for (const m of results?.payload?.metrics ?? []) {
    const field = METRICS[m.metric_id];
    if (!field) continue;
    for (const [name, v] of Object.entries(m.variants ?? {})) {
      const target = variants[name];
      if (!target) continue;
      target[field] = Number(v.sum) || 0;
      target.exposed = Math.max(target.exposed, Number(v.n) || 0);
    }
    if (m.inference && Object.keys(m.inference).length) inference[field] = m.inference;
  }

  return {
    experiment: {
      id: experiment?.id,
      name: experiment?.name,
      hypothesis: experiment?.hypothesis,
      status: experiment?.status,
      startedAt: experiment?.started_at,
      endedAt: experiment?.ended_at,
    },
    asOf: results?.as_of ?? null,
    isFinal: Boolean(results?.is_final),
    srmPValue: results?.payload?.srm_p_value ?? null,
    variants,
    inference, // Flagsmith's own statistics, once it has enough data
    flagsmithChance: groupedChanceToWin(inference.found), // primary metric (585)
    rollout, // { enabled, groupedPercent } once the experiment has ended, else null
  };
}
