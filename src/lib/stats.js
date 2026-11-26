// Small stats helpers for the results page.
//
// Win probability (Beta-Binomial): each version's true success rate is uncertain. With
// a uniform prior, after `c` successes out of `n` players, the rate follows Beta(1+c, 1+n-c).
// We draw many samples from both and count how often grouped's draw beats the list's.
// That fraction is P(grouped is truly better), a plain-English, explainable number.

// Gamma(shape, 1) sampler: Marsaglia & Tsang (2000). Used to build Beta samples.
function sampleGamma(shape) {
  if (shape < 1) return sampleGamma(shape + 1) * Math.random() ** (1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do {
      // standard normal via Box-Muller
      x = Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleBeta(a, b) {
  const x = sampleGamma(a);
  return x / (x + sampleGamma(b));
}

// P(rate_B > rate_A) given successes/trials for each.
export function probabilityBBeatsA(successA, trialsA, successB, trialsB, draws = 20000) {
  if (!trialsA || !trialsB) return null;
  let wins = 0;
  for (let i = 0; i < draws; i++) {
    if (sampleBeta(1 + successB, 1 + trialsB - successB) > sampleBeta(1 + successA, 1 + trialsA - successA)) wins++;
  }
  return wins / draws;
}

export const rate = (part, whole) => (whole ? part / whole : null);

export const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`);
