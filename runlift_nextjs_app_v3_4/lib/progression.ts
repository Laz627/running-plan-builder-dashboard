// /lib/progression.ts

// Parse "mm:ss" → total seconds (NaN if invalid)
export function mmssToSec(v: string): number {
  const m = v?.trim().match(/^(\d+):([0-5]?\d)$/);
  if (!m) return NaN;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

// Seconds → "mm:ss" (clamped ≥ 0)
export function secToMMSS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// Combine baseline + adjustment seconds → "mm:ss"
export function adjustedPaceFromBaseline(baselineMMSS: string, adjSec: number): string {
  const base = mmssToSec(baselineMMSS);
  if (!Number.isFinite(base)) return baselineMMSS;
  const adj = Number.isFinite(adjSec) ? adjSec : 0;
  return secToMMSS(base + adj);
}

// Gentle, capped accumulation behaviour for RPE-driven adjustments.
// Tweak these constants to taste.
export const MAX_ADJ_SEC = 30;  // cap total slow-down at +00:30
export const STEP_SEC = 5;      // +5s per "tough" day

/**
 * Given current cumulative adjustment (seconds) and today's RPE,
 * return the next cumulative adjustment (seconds), capped and non-negative.
 *
 * Suggested defaults:
 *  - RPE 6–7: add STEP_SEC (tough day)
 *  - RPE ≤5: reset to 0 (easy/recovery day)
 *  - RPE 8–10: hold steady (or customize as you like)
 */
export function nextAdjustmentSeconds(currentAdjSec: number, rpe: number): number {
  let next = Number.isFinite(currentAdjSec) ? currentAdjSec : 0;

  if (rpe >= 6 && rpe <= 7) {
    next += STEP_SEC;           // tougher day → nudge upward
  } else if (rpe <= 5) {
    next = 0;                   // easy/recovery → reset (or unwind by STEP_SEC)
  }
  // rpe 8–10: hold (customize here if desired)

  if (next < 0) next = 0;
  if (next > MAX_ADJ_SEC) next = MAX_ADJ_SEC;
  return next;
}

// Number helper (parse-or-fallback)
export function num(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** (Optional legacy) single-step adjuster kept for compatibility */
export function nextPace(currentMMSS: string, rpe: number): string {
  const cur = mmssToSec(currentMMSS);
  if (!Number.isFinite(cur)) return currentMMSS;
  if (rpe <= 6) return secToMMSS(cur - STEP_SEC);
  if (rpe >= 9) return secToMMSS(cur + (rpe >= 10 ? 2 * STEP_SEC : STEP_SEC));
  return currentMMSS;
}
