// /lib/progression.ts

// Parse "mm:ss" → seconds
export function mmssToSec(v: string): number {
  const m = v?.trim().match(/^(\d+):([0-5]?\d)$/);
  if (!m) return NaN;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

// Seconds → "mm:ss"
export function secToMMSS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// Tunables (seconds per mile)
export const PENALTY_SEC = 10;   // when RPE > 7 (stacking slowdown)
export const RECOVERY_SEC = 5;   // when RPE ≤ 7 (slower/firmer recovery)
export const MAX_ADJ_SEC = 120;  // cap total adjustment at +2:00/mi

export function nextAdjustmentSeconds(currentAdjSec: number, rpe: number): number {
  let next = currentAdjSec;
  if (rpe > 7) {
    // stack penalty
    next = currentAdjSec + PENALTY_SEC;
  } else {
    // gentle recovery toward baseline
    next = currentAdjSec - RECOVERY_SEC;
  }
  // clamp between 0 and MAX
  if (next < 0) next = 0;
  if (next > MAX_ADJ_SEC) next = MAX_ADJ_SEC;
  return next;
}

export function adjustedPaceFromBaseline(baselineMMSS: string, adjSec: number): string {
  const base = mmssToSec(baselineMMSS);
  if (!Number.isFinite(base)) return baselineMMSS;
  return secToMMSS(base + adjSec);
}

// Helper
export function num(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
