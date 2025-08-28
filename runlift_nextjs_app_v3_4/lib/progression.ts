// /lib/progression.ts

// ---------- Time helpers ----------

/** Parse "mm:ss" → total seconds (NaN if invalid). */
export function mmssToSec(v: string): number {
  const m = v?.trim().match(/^(\d+):([0-5]?\d)$/);
  if (!m) return NaN;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

/** Seconds → "mm:ss" (clamped ≥ 0). */
export function secToMMSS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Baseline "mm:ss" + adjustment (seconds) → "mm:ss". */
export function adjustedPaceFromBaseline(baselineMMSS: string, adjSec: number): string {
  const base = mmssToSec(baselineMMSS);
  if (!Number.isFinite(base)) return baselineMMSS;
  const adj = Number.isFinite(adjSec) ? adjSec : 0;
  return secToMMSS(base + adj);
}

// ---------- RPE → cumulative pace adjustment ----------

export const MAX_ADJ_SEC = 30;   // cap total slow-down at +00:30
export const STEP_SEC = 5;       // +5s per tougher day

/**
 * Given current cumulative adjustment (seconds) and today's RPE,
 * return the next cumulative adjustment (seconds), capped and ≥ 0.
 *
 * Defaults:
 *  - RPE 6–7: add STEP_SEC (tough day)
 *  - RPE ≤5: reset to 0 (easy/recovery)
 *  - RPE 8–10: hold (customize if desired)
 */
export function nextAdjustmentSeconds(currentAdjSec: number, rpe: number): number {
  let next = Number.isFinite(currentAdjSec) ? currentAdjSec : 0;

  if (rpe >= 6 && rpe <= 7) {
    next += STEP_SEC;
  } else if (rpe <= 5) {
    next = 0;
  }
  // rpe 8–10: hold steady by default

  if (next < 0) next = 0;
  if (next > MAX_ADJ_SEC) next = MAX_ADJ_SEC;
  return next;
}

// ---------- Lifting progression (fix: export nextWeight) ----------

/**
 * Progress lifting weight based on RPE and body region, with configurable increments.
 *
 * @param current   current working weight
 * @param rpe       session RPE (1–10)
 * @param region    'upper' | 'lower'
 * @param assisted  true if assisted movement (use assisted increment)
 * @param incUpper  default increment for upper-body lifts (e.g., 5)
 * @param incLower  default increment for lower-body lifts (e.g., 10)
 * @param incAssist default increment for assisted lifts (e.g., 5)
 */
export function nextWeight(
  current: number,
  rpe: number,
  region: 'upper' | 'lower',
  assisted: boolean,
  incUpper: number,
  incLower: number,
  incAssist: number
): number {
  const safeNum = (x: any, d: number) => (Number.isFinite(Number(x)) ? Number(x) : d);
  const cur = safeNum(current, 0);
  const rp = safeNum(rpe, 7);

  const inc = assisted ? safeNum(incAssist, 5) : (region === 'lower' ? safeNum(incLower, 10) : safeNum(incUpper, 5));
  const half = Math.max(1.25, Math.round(inc / 2 * 2) / 2); // half-step, rounded to nearest 0.5

  // Simple, sensible rules:
  // ≤6 (too easy) → +inc
  // 7 (just right) → hold
  // 8 (a bit hard) → -half
  // ≥9 (too hard) → -inc
  if (rp <= 6) return cur + inc;
  if (rp === 7) return cur;
  if (rp === 8) return Math.max(0, cur - half);
  return Math.max(0, cur - inc);
}

// ---------- Misc ----------

/** Parse-or-fallback number helper. */
export function num(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Legacy single-step pace adjuster kept for compatibility. */
export function nextPace(currentMMSS: string, rpe: number): string {
  const cur = mmssToSec(currentMMSS);
  if (!Number.isFinite(cur)) return currentMMSS;
  if (rpe <= 6) return secToMMSS(cur - STEP_SEC);
  if (rpe >= 9) return secToMMSS(cur + (rpe >= 10 ? 2 * STEP_SEC : STEP_SEC));
  return currentMMSS;
}
