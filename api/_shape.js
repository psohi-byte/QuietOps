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

export function shapeResults(experiment, results) {
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
  };
}
