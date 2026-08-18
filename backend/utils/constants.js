/**
 * Platform-wide reference data.
 *
 * The tree-age yield table below is the single source of truth for every
 * "how much should this orchard produce?" calculation in the app. It is
 * deliberately a plain lookup table, not a model: an officer must be able to
 * read the number off the page, reproduce it on paper, and defend it in a
 * district report.
 *
 * Keep `frontend/src/utils/treeAgeYield.js` in sync with TREE_AGE_BRACKETS.
 */

// ---------------------------------------------------------------------------
// Tree age → production
// ---------------------------------------------------------------------------

/**
 * `key`         matches the tree-age keys used by both models:
 *               Survey.treeAgeDistribution[].ageRange (array form) and
 *               Farm.treeAgeDistribution (object form).
 * `kgPerTree`   the suggested planning value — the number used for all
 *               expected-production maths.
 * `minKg`/`maxKg` the indicative observed range, used to show a plausible
 *               band rather than a single false-precision figure.
 */
export const TREE_AGE_BRACKETS = [
  { key: '1-3',   label: '1–3 years',   kgPerTree: 0,   minKg: 0,   maxKg: 0,   note: 'Not yet bearing' },
  { key: '4-5',   label: '4–5 years',   kgPerTree: 10,  minKg: 0,   maxKg: 20,  note: 'First fruiting' },
  { key: '6-10',  label: '6–10 years',  kgPerTree: 65,  minKg: 20,  maxKg: 115, note: 'Building yield' },
  { key: '11-15', label: '11–15 years', kgPerTree: 125, minKg: 110, maxKg: 140, note: 'Peak yield' },
  { key: '16-25', label: '16–25 years', kgPerTree: 100, minKg: 85,  maxKg: 115, note: 'Steady' },
  { key: '26-40', label: '26–40 years', kgPerTree: 150, minKg: 100, maxKg: 200, note: 'Large mature trees' },
  { key: '40+',   label: '40+ years',   kgPerTree: 125, minKg: 100, maxKg: 150, note: 'Declining / variable' },
];

/** Bracket keys in canonical order — use this instead of re-typing the strings. */
export const TREE_AGE_KEYS = TREE_AGE_BRACKETS.map((b) => b.key);

const BRACKET_BY_KEY = TREE_AGE_BRACKETS.reduce((acc, b) => ({ ...acc, [b.key]: b }), {});

export const getBracket = (key) => BRACKET_BY_KEY[key] || null;

/**
 * The two models store the distribution differently:
 *   Survey → [{ ageRange: '6-10', numberOfTrees: 40 }, ...]
 *   Farm   → { '1-3': 0, '6-10': 40, ... }
 * Both collapse to the same plain { key: count } object here so every caller
 * downstream can stop caring which one it was handed.
 */
export const normalizeTreeAgeDistribution = (input) => {
  const out = TREE_AGE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  if (!input) return out;

  if (Array.isArray(input)) {
    input.forEach((entry) => {
      const key = entry?.ageRange;
      if (key in out) out[key] += Number(entry.numberOfTrees) || 0;
    });
    return out;
  }

  // Mongoose subdocument or plain object
  const source = typeof input.toObject === 'function' ? input.toObject() : input;
  TREE_AGE_KEYS.forEach((key) => {
    out[key] = Number(source[key]) || 0;
  });
  return out;
};

/** Total trees recorded across all brackets. */
export const countTrees = (distribution) =>
  Object.values(normalizeTreeAgeDistribution(distribution)).reduce((sum, n) => sum + n, 0);

/** Trees old enough to bear fruit (kgPerTree > 0). */
export const countBearingTrees = (distribution) => {
  const dist = normalizeTreeAgeDistribution(distribution);
  return TREE_AGE_BRACKETS.reduce(
    (sum, b) => (b.kgPerTree > 0 ? sum + dist[b.key] : sum),
    0
  );
};

/**
 * Expected annual production for a distribution, using the planning values.
 * Returns the headline figure plus the plausible band.
 */
export const calculateExpectedProduction = (distribution) => {
  const dist = normalizeTreeAgeDistribution(distribution);

  let expectedKg = 0;
  let minKg = 0;
  let maxKg = 0;

  TREE_AGE_BRACKETS.forEach((b) => {
    const count = dist[b.key];
    expectedKg += count * b.kgPerTree;
    minKg += count * b.minKg;
    maxKg += count * b.maxKg;
  });

  return {
    expectedKg: Math.round(expectedKg),
    minKg: Math.round(minKg),
    maxKg: Math.round(maxKg),
    totalTrees: countTrees(dist),
    bearingTrees: countBearingTrees(dist),
    perBracket: TREE_AGE_BRACKETS.map((b) => ({
      key: b.key,
      label: b.label,
      trees: dist[b.key],
      kgPerTree: b.kgPerTree,
      expectedKg: Math.round(dist[b.key] * b.kgPerTree),
    })),
  };
};

// ---------------------------------------------------------------------------
// Yield-gap review thresholds
// ---------------------------------------------------------------------------

/**
 * How far a reported figure may drift from the expected figure before the
 * officer is asked to look twice. These are review prompts, not verdicts —
 * a real orchard can legitimately sit outside them after hail or a bad
 * flowering year, which is exactly why the officer, not the system, decides.
 */
export const YIELD_REVIEW_THRESHOLDS = {
  ok: 25,     // within ±25% of expected
  review: 50, // 25–50% off — worth a question
};

export const YIELD_FLAGS = {
  NO_DATA: 'no-data',
  NO_BEARING: 'no-bearing',
  OK: 'ok',
  REVIEW: 'review',
  OUTLIER: 'outlier',
};

export const YIELD_FLAG_LABELS = {
  [YIELD_FLAGS.NO_DATA]: 'No tree ages recorded',
  [YIELD_FLAGS.NO_BEARING]: 'No bearing trees yet',
  [YIELD_FLAGS.OK]: 'Consistent with tree ages',
  [YIELD_FLAGS.REVIEW]: 'Worth checking',
  [YIELD_FLAGS.OUTLIER]: 'Large discrepancy',
};

/**
 * Compare a reported production figure against what the tree ages imply.
 * Pure arithmetic — no model, no prediction, no AI.
 *
 * `treesRecorded` separates two cases that both produce an expected figure of
 * zero but mean opposite things to an officer: a survey where nobody filled in
 * the tree ages (nothing to check against), and a genuinely young orchard
 * where every tree is under four years old (a real finding).
 */
export const calculateYieldGap = (expectedKg, reportedKg, treesRecorded = null) => {
  const expected = Number(expectedKg) || 0;
  const reported = Number(reportedKg) || 0;

  if (expected <= 0) {
    const noAgesRecorded = treesRecorded !== null ? Number(treesRecorded) <= 0 : reported <= 0;
    return {
      expectedKg: expected,
      reportedKg: reported,
      gapKg: 0,
      gapPercent: null,
      flag: noAgesRecorded ? YIELD_FLAGS.NO_DATA : YIELD_FLAGS.NO_BEARING,
    };
  }

  const gapKg = Math.round(reported - expected);
  const gapPercent = parseFloat((((reported - expected) / expected) * 100).toFixed(2));
  const drift = Math.abs(gapPercent);

  let flag = YIELD_FLAGS.OUTLIER;
  if (drift <= YIELD_REVIEW_THRESHOLDS.ok) flag = YIELD_FLAGS.OK;
  else if (drift <= YIELD_REVIEW_THRESHOLDS.review) flag = YIELD_FLAGS.REVIEW;

  return { expectedKg: expected, reportedKg: reported, gapKg, gapPercent, flag };
};

// ---------------------------------------------------------------------------
// Bikram Sambat census year
// ---------------------------------------------------------------------------

/**
 * The census is keyed by BS year because that is what the district office
 * files under. The BS new year (Baisakh 1) falls on 13–14 April in the
 * Gregorian calendar; we cut over on 14 April, which is accurate to within a
 * day and needs no conversion library. A census year is a whole season, so a
 * one-day boundary error cannot land a survey in the wrong year in practice.
 */
const BS_NEW_YEAR_MONTH = 3; // April, zero-indexed
const BS_NEW_YEAR_DAY = 14;

export const getCurrentBsYear = (date = new Date()) => {
  const ad = date.getFullYear();
  const afterNewYear =
    date.getMonth() > BS_NEW_YEAR_MONTH ||
    (date.getMonth() === BS_NEW_YEAR_MONTH && date.getDate() >= BS_NEW_YEAR_DAY);
  return afterNewYear ? ad + 57 : ad + 56;
};

/** Earliest census year the platform accepts — guards against typos like 208. */
export const MIN_CENSUS_YEAR_BS = 2070;
export const MAX_CENSUS_YEAR_BS = () => getCurrentBsYear() + 1;

export const isValidCensusYear = (year) => {
  const y = Number(year);
  return Number.isInteger(y) && y >= MIN_CENSUS_YEAR_BS && y <= MAX_CENSUS_YEAR_BS();
};

/** Descending list of selectable census years, newest first. */
export const censusYearOptions = (count = 6) => {
  const current = getCurrentBsYear();
  return Array.from({ length: count }, (_, i) => current - i).filter(
    (y) => y >= MIN_CENSUS_YEAR_BS
  );
};

// ---------------------------------------------------------------------------
// Unit conversions
// ---------------------------------------------------------------------------

export const KATHA_TO_HECTARE = 0.0338;
export const KG_TO_MT = 0.001;

export const kathaToHectare = (katha) =>
  parseFloat(((Number(katha) || 0) * KATHA_TO_HECTARE).toFixed(4));

export const kgToMetricTonnes = (kg) =>
  parseFloat(((Number(kg) || 0) * KG_TO_MT).toFixed(4));

export default {
  TREE_AGE_BRACKETS,
  TREE_AGE_KEYS,
  getBracket,
  normalizeTreeAgeDistribution,
  countTrees,
  countBearingTrees,
  calculateExpectedProduction,
  calculateYieldGap,
  YIELD_FLAGS,
  YIELD_FLAG_LABELS,
  YIELD_REVIEW_THRESHOLDS,
  getCurrentBsYear,
  isValidCensusYear,
  censusYearOptions,
  kathaToHectare,
  kgToMetricTonnes,
};
