
export function mmssToMin(p: string): number | null {
  const parts = p.split(':');
  if (parts.length !== 2) return null;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(s)) return null;
  return m + s/60;
}
export function minToMMSS(x: number): string {
  const m = Math.floor(x);
  let s = Math.round((x - m) * 60);
  let mm = m;
  if (s === 60) { mm += 1; s = 0; }
  return `${mm}:${s.toString().padStart(2,'0')}`;
}
export function heatHumidityFactor(t: number, h: number): number {
  let heat = 0;
  if (t <= 60) heat = 0;
  else if (t <= 65) heat = 0.01;
  else if (t <= 70) heat = 0.02;
  else if (t <= 75) heat = 0.03;
  else if (t <= 80) heat = 0.04;
  else if (t <= 85) heat = 0.05;
  else if (t <= 90) heat = 0.07;
  else heat = 0.10;
  const humid = h >= 80 ? 0.02 : (h >= 60 ? 0.01 : 0);
  return 1 + heat + humid;
}
export function paceBands(baseMin: number, kind: string) {
  if (['Easy','Recovery'].includes(kind)) {
    return [baseMin + 0.25, baseMin, baseMin - 0.25] as const;
  }
  return [baseMin + 0.17, baseMin, baseMin - 0.17] as const;
}
