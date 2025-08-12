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

/**
 * Running progression:
 * - If RPE ≤ 6 and user hit/beat target → get slightly faster next time (-5s).
 * - If RPE 7–8 → hold.
 * - If RPE ≥ 9 → slow down (+5–10s depending on how hard it felt).
 */
export function nextPace(currentMMSS: string, rpe: number): string {
  const cur = mmssToSec(currentMMSS);
  if (!Number.isFinite(cur)) return currentMMSS;

  if (rpe <= 6) return secToMMSS(cur - 5);
  if (rpe >= 9) return secToMMSS(cur + (rpe >= 10 ? 10 : 5));
  return currentMMSS; // hold for RPE 7–8
}

/**
 * Lifting progression:
 * - Non-assisted (upper): default +incUpper if RPE ≤ 7, +2.5 lb if RPE = 8,
 *   hold at 9, deload -5 lb at 10.
 * - Non-assisted (lower): default +incLower if RPE ≤ 7, +5 lb if RPE = 8,
 *   hold at 9, deload -10 lb at 10.
 * - Assisted: we store "assistance" weight; less assistance = harder.
 *   If RPE ≤ 7 → assistance -incAssist; RPE 8 → -2.5; RPE 9 → hold; RPE 10 → +5.
 */
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

// Helper to parse numbers safely
export function num(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
