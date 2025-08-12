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
export const RECOVERY_SEC = 5;   // when RPE ≤ 7 (slower recovery)
export const MAX_ADJ_SEC = 120;  // cap total adjustment at +2:00/mi

/** Compute the new cumulative adjustment (in seconds) from baseline pace. */
export function nextAdjustmentSeconds(currentAdjSec: number, rpe: number): number {
  let next = currentAdjSec;
  if (rpe > 7) next = currentAdjSec + PENALTY_SEC;      // stack penalty
  else         next = currentAdjSec - RECOVERY_SEC;     // gentle recovery
  if (next < 0) next = 0;
  if (next > MAX_ADJ_SEC) next = MAX_ADJ_SEC;
  return next;
}

export function adjustedPaceFromBaseline(baselineMMSS: string, adjSec: number): string {
  const base = mmssToSec(baselineMMSS);
  if (!Number.isFinite(base)) return baselineMMSS;
  return secToMMSS(base + adjSec);
}

export function num(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function nextWeight(
  current: number,
  rpe: number,
  region: 'upper' | 'lower',
  isAssisted: boolean,
  incUpper: number,
  incLower: number,
  incAssist: number
): number {
  if (isAssisted) {
    if (rpe <= 7) return Math.max(0, current - incAssist);
    if (rpe === 8) return Math.max(0, current - 2.5);
    if (rpe >= 10) return current + 5;
    return current; // rpe 9 hold
  } else {
    if (rpe <= 7) return current + (region === 'lower' ? incLower : incUpper);
    if (rpe === 8) return current + (region === 'lower' ? 5 : 2.5);
    if (rpe >= 10) return Math.max(0, current - (region === 'lower' ? 10 : 5));
    return current; // rpe 9 hold
  }
}

export function nextPace(currentMMSS: string, rpe: number): string {
  // Simple single-step adjuster kept only to avoid build errors if an old route still imports it.
  const cur = mmssToSec(currentMMSS);
  if (!Number.isFinite(cur)) return currentMMSS;
  if (rpe <= 6) return secToMMSS(cur - 5);
  if (rpe >= 9) return secToMMSS(cur + (rpe >= 10 ? 10 : 5));
  return currentMMSS;
}
