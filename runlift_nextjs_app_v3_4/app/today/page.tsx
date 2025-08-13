'use client';

import { motion } from 'framer-motion';
import Card from '@/components/Card';
import Modal from '@/components/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/Toaster';
import { LIFT_EXERCISES, RUN_TYPES } from '@/lib/exercises';

/* =========================
   Types
========================= */
type RunLog = {
  id?: number;
  logDate: string;
  runType?: string | null;
  plannedDesc?: string | null;
  targetPaceCool?: string | null;
  targetPaceHeat?: string | null;
  actualDistance?: number | null;
  actualPace?: string | null;
  rpe?: number | null;
  notes?: string | null;
};

type LiftLog = {
  id?: number;
  logDate: string;
  dayType?: string | null;
  exercise?: string | null;
  weight?: number | null; // assisted = assist lbs
  sets?: number | null;
  reps?: number | null;
  rpe?: number | null;
  notes?: string | null;
};

type Settings = {
  // run bases
  goal_mp?: string;     // marathon pace (mm:ss)
  tempo_base?: string;
  easy_base?: string;   // kept for backward compat, but MR/Easy now derive from MP
  speed_base?: string;
  recovery_base?: string;

  // weather
  temp?: string;
  humidity?: string;

  // lifting
  start_incline?: string; start_shoulder?: string; start_dips?: string; start_rows?: string;
  start_pu?: string; start_lat?: string; start_legpress?: string; start_ham?: string; start_calf?: string;
  inc_upper?: string; inc_lower?: string; inc_assist?: string;
};

/* =========================
   Small helpers
========================= */
function isoToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function parsePace(p: string | undefined | null): number | null {
  if (!p) return null;
  const parts = p.trim().split(':').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  return parts[0] * 60 + parts[1];
}
function fmtPace(sec: number | null): string {
  if (sec === null || !isFinite(sec)) return '';
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2,'0')}`;
}
const num = (x: any, d = 0) => {
  const n = typeof x === 'number' ? x : parseFloat(String(x || '').trim());
  return Number.isFinite(n) ? n : d;
};

/* =========================
   Weather adjustment (baseline 60°F / 50% humidity)
========================= */
function heatAdjMultiplier(tempF: number, humidityPct: number): number {
  const tAdj = Math.max(0, (tempF - 60) / 5) * 0.01;        // +1% per +5°F
  const hAdj = Math.max(0, (humidityPct - 50) / 10) * 0.005; // +0.5% per +10%
  const total = Math.min(0.12, tAdj + hAdj);                 // clamp 12%
  return 1 + total;
}

/* =========================
   RUN: targets + stacking
========================= */
const RPE_TARGET_RUN: Record<string, [number, number]> = {
  Medium: [5, 6],
  Tempo: [6, 7],
  Easy: [4, 5],
  Speed: [8, 9],
  Recovery: [3, 4],
};

function consecutiveOutOfRangeRuns(runs: RunLog[], runType: string, low: number, high: number) {
  const recentSame = [...runs]
    .filter(r => r.runType === runType)
    .sort((a, b) => (a.logDate < b.logDate ? 1 : -1)); // newest first
  let highStreak = 0;
  let lowStreak = 0;
  for (const r of recentSame) {
    if (r.rpe == null) continue;
    if (r.rpe > high) { highStreak++; lowStreak = 0; }
    else if (r.rpe < low) { lowStreak++; highStreak = 0; }
    else { break; }
  }
  return { highStreak, lowStreak };
}

function rpeAdjSeconds(runs: RunLog[], runType: string) {
  const [low, high] = RPE_TARGET_RUN[runType] ?? [5, 7];
  const { highStreak, lowStreak } = consecutiveOutOfRangeRuns(runs, runType, low, high);
  let sec = 0;
  if (highStreak >= 1) sec += 5;
  if (highStreak >= 2) sec += 5;
  if (highStreak >= 3) sec += 5;
  if (lowStreak >= 2) sec -= 5;
  return sec;
}

/* =========================
   RUN: derived bases from MP
   - Medium = MP + 50s (mid of 45–60s)
   - Easy   = MP + 75s (mid of 60–90s)
========================= */
function deriveMediumFromMP(mp: string | undefined | null): string | null {
  const mpSec = parsePace(mp);
  if (mpSec == null) return null;
  return fmtPace(mpSec + 50); // midpoint of 45–60s slower than MP
}
function deriveEasyFromMP(mp: string | undefined | null): string | null {
  const mpSec = parsePace(mp);
  if (mpSec == null) return null;
  return fmtPace(mpSec + 75); // midpoint of 60–90s slower than MP
}

/* =========================
   RUN: band row builders
========================= */
function bandRowFromStr(
  name: string,
  baseStr: string | null | undefined,
  tempF: number,
  humidityPct: number,
  aggrDeltaSec = -10,
  consDeltaSec = +15,
  extraSec = 0
) {
  const base = parsePace(baseStr || '');
  const mult = heatAdjMultiplier(tempF, humidityPct);
  const today = base ? Math.round(base * mult) + extraSec : null;
  return {
    name,
    base: fmtPace(base),
    today: fmtPace(today),
    aggressive: fmtPace(today !== null ? today + aggrDeltaSec : null),
    conservative: fmtPace(today !== null ? today + consDeltaSec : null),
    rpeDeltaSec: extraSec,
  };
}

/* =========================
   LIFT: categories, targets, stacking
========================= */
const LIFT_RPE_TARGET: [number, number] = [7, 8];

function exerciseCategory(ex: string): 'upper' | 'lower' | 'assist' {
  const e = ex.toLowerCase();
  if (e.includes('assisted pull') || e.includes('assisted dip')) return 'assist';
  if (e.includes('leg') || e.includes('hamstring') || e.includes('calf')) return 'lower';
  return 'upper';
}
function lastWeightForExercise(logs: LiftLog[], ex: string): number | null {
  const recent = [...logs]
    .filter(l => l.exercise === ex && l.weight != null)
    .sort((a, b) => (a.logDate < b.logDate ? 1 : -1));
  return recent.length ? (recent[0].weight ?? null) : null;
}
function consecutiveOutOfRangeLifts(logs: LiftLog[], ex: string, low: number, high: number) {
  const recent = [...logs]
    .filter(l => l.exercise === ex)
    .sort((a, b) => (a.logDate < b.logDate ? 1 : -1));
  let highStreak = 0;
  let lowStreak = 0;
  for (const l of recent) {
    if (l.rpe == null) continue;
    if (l.rpe > high) { highStreak++; lowStreak = 0; }
    else if (l.rpe < low) { lowStreak++; highStreak = 0; }
    else { break; }
  }
  return { highStreak, lowStreak };
}
function liftRecommendation(ex: string, logs: LiftLog[], settings: Settings) {
  const cat = exerciseCategory(ex);
  const incUpper = Number(settings.inc_upper ?? '5');
  const incLower = Number(settings.inc_lower ?? '10');
  const incAssist = Number(settings.inc_assist ?? '5');
  const inc = cat === 'assist' ? incAssist : (cat === 'lower' ? incLower : incUpper);

  const startMap: Record<string, string | undefined> = {
    'Incline Chest Press (lb)': settings.start_incline,
    'Shoulder Press (lb)': settings.start_shoulder,
    'Assisted Dips (assist lb)': settings.start_dips,
    'Seated Rows (lb)': settings.start_rows,
    'Assisted Pull-ups (assist lb)': settings.start_pu,
    'Lat Pulldowns (lb)': settings.start_lat,
    'Leg Press (lb)': settings.start_legpress,
    'Hamstring Curl (lb)': settings.start_ham,
    'Calf Raises (lb)': settings.start_calf,
  };
  let startValStr = startMap[ex];
  if (!startValStr) {
    const lowerKey = Object.keys(startMap).find(k => ex.toLowerCase().includes(k.toLowerCase().split(' (')[0]));
    if (lowerKey) startValStr = startMap[lowerKey];
  }

  const last = lastWeightForExercise(logs, ex);
  const start = Number(startValStr ?? (cat === 'assist' ? '60' : '35'));
  const base = (last ?? start);

  const { highStreak, lowStreak } = consecutiveOutOfRangeLifts(logs, ex, LIFT_RPE_TARGET[0], LIFT_RPE_TARGET[1]);

  let delta = 0;
  if (highStreak >= 1) delta -= inc;
  if (highStreak >= 2) delta -= inc;
  if (highStreak >= 3) delta -= inc;
  if (lowStreak >= 2) delta += inc;

  const apply = (w: number, deltaLbs: number) => {
    if (cat === 'assist') return Math.max(0, w - deltaLbs); // lower assist when harder
    return Math.max(0, w + deltaLbs);
  };

  const today = apply(base, Math.max(-3 * inc, Math.min(3 * inc, delta)));
  const aggressive = apply(today, inc);
  const conservative = apply(today, -inc);
  const rpeDeltaLbs = (cat === 'assist') ? -delta : delta;

  return { exercise: ex, last: base, today, aggressive, conservative, rpeDeltaLbs, inc, cat };
}

/* =========================
   Component
========================= */
export default function TodayPage() {
  // recent logs
  const [recentRuns, setRecentRuns] = useState<RunLog[]>([]);
  const [recentLifts, setRecentLifts] = useState<LiftLog[]>([]);
  async function loadRecent() {
    const r = await fetch('/api/logs/history?type=all&limit=60').then((r) => r.json());
    setRecentRuns(r.runs || []);
    setRecentLifts(r.lifts || []);
  }
  useEffect(() => { loadRecent(); }, []);

  // settings
  const [settings, setSettings] = useState<Settings>({
    goal_mp:'9:40', tempo_base:'9:00', easy_base:'10:30', speed_base:'7:55', recovery_base:'10:35',
    temp:'80', humidity:'60',
    start_incline:'35', start_shoulder:'35', start_dips:'60', start_rows:'90',
    start_pu:'60', start_lat:'75', start_legpress:'160', start_ham:'60', start_calf:'45',
    inc_upper:'5', inc_lower:'10', inc_assist:'5'
  });
  useEffect(() => {
    fetch('/api/settings').then(r=>r.ok?r.json():{}).then(s => s && setSettings(prev=>({...prev, ...s}))).catch(()=>{});
  }, []);

  /* ---------- RUN bands ---------- */
  const tempF = num(settings.temp, 80);
  const humidityPct = num(settings.humidity, 60);

  // Derived bases
  const mediumBase = deriveMediumFromMP(settings.goal_mp); // MP + ~50s
  const easyBase   = deriveEasyFromMP(settings.goal_mp);   // MP + ~75s

  const rpeSec = useMemo(() => ({
    Medium:   rpeAdjSeconds(recentRuns, 'Medium'),
    Tempo:    rpeAdjSeconds(recentRuns, 'Tempo'),
    Easy:     rpeAdjSeconds(recentRuns, 'Easy'),
    Speed:    rpeAdjSeconds(recentRuns, 'Speed'),
    Recovery: rpeAdjSeconds(recentRuns, 'Recovery'),
  }), [recentRuns]);

  const paceRows = useMemo(() => ([
    // Replaces old "Marathon" row with "Medium" derived from MP
    bandRowFromStr('Medium',   mediumBase,           tempF, humidityPct, -10, +15, rpeSec.Medium),
    bandRowFromStr('Tempo',    settings.tempo_base,  tempF, humidityPct, -10, +15, rpeSec.Tempo),
    bandRowFromStr('Easy',     easyBase,             tempF, humidityPct, -10, +15, rpeSec.Easy),
    bandRowFromStr('Speed',    settings.speed_base,  tempF, humidityPct, -10, +15, rpeSec.Speed),
    bandRowFromStr('Recovery', settings.recovery_base,tempF, humidityPct, -10, +15, rpeSec.Recovery),
  ]), [settings, tempF, humidityPct, rpeSec, mediumBase, easyBase]);

  /* ---------- LIFT recommendations ---------- */
  const liftRecs = useMemo(() => {
    return LIFT_EXERCISES.map(ex => liftRecommendation(ex, recentLifts, settings));
  }, [recentLifts, settings]);

  // ---------- RUN modal ----------
  const [runOpen, setRunOpen] = useState(false);
  const [editingRunId, setEditingRunId] = useState<number | null>(null);
  const [run, setRun] = useState<RunLog>({
    logDate: isoToday(),
    runType: 'Easy',
    actualDistance: 0,
    actualPace: '',
    rpe: 7,
    notes: '',
  });
  function setRunField<K extends keyof RunLog>(k: K, v: any) { setRun(f => ({ ...f, [k]: v })); }
  function resetRunForm() {
    setEditingRunId(null);
    setRun({ logDate: isoToday(), runType: 'Easy', actualDistance: 0, actualPace: '', rpe: 7, notes: '' });
  }
  function openRunEditor(entry?: RunLog) {
    if (entry) {
      setEditingRunId(entry.id!);
      setRun({
        logDate: entry.logDate?.slice(0, 10) || isoToday(),
        runType: entry.runType || 'Easy',
        plannedDesc: entry.plannedDesc || '',
        targetPaceCool: entry.targetPaceCool || '',
        targetPaceHeat: entry.targetPaceHeat || '',
        actualDistance: entry.actualDistance ?? 0,
        actualPace: entry.actualPace || '',
        rpe: entry.rpe ?? 7,
        notes: entry.notes || '',
      });
    } else {
      resetRunForm();
    }
    setRunOpen(true);
  }
  async function saveRun() {
    const method = editingRunId ? 'PUT' : 'POST';
    const url = editingRunId ? `/api/logs/run/${editingRunId}` : '/api/logs/run';
    const ok = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(run) })
      .then(r=>r.ok).catch(()=>false);
    if (ok) { toast({ title: editingRunId?'Run updated':'Run saved', description: 'Entry stored successfully.' }); setRunOpen(false); resetRunForm(); loadRecent(); }
    else { toast({ title:'Error', description:'Could not save run.' }); }
  }
  async function deleteRun(id: number) {
    const ok = await fetch(`/api/logs/run/${id}`, { method:'DELETE' }).then(r=>r.ok).catch(()=>false);
    if (ok) { toast({ title:'Run deleted', description:'Entry removed.' }); loadRecent(); }
    else { toast({ title:'Error', description:'Could not delete run.' }); }
  }

  // ---------- LIFT modal ----------
  const [liftOpen, setLiftOpen] = useState(false);
  const [editingLiftId, setEditingLiftId] = useState<number | null>(null);
  const [lift, setLift] = useState<LiftLog>({
    logDate: isoToday(),
    dayType: 'Push',
    exercise: LIFT_EXERCISES[0],
    weight: 0,
    sets: 3,
    reps: 8,
    rpe: 7,
    notes: '',
  });
  function setLiftField<K extends keyof LiftLog>(k: K, v: any) { setLift(f => ({ ...f, [k]: v })); }
  function resetLiftForm() {
    setEditingLiftId(null);
    setLift({ logDate: isoToday(), dayType:'Push', exercise:LIFT_EXERCISES[0], weight:0, sets:3, reps:8, rpe:7, notes:'' });
  }
  function openLiftEditor(entry?: LiftLog) {
    if (entry) {
      setEditingLiftId(entry.id!);
      setLift({
        logDate: entry.logDate?.slice(0, 10) || isoToday(),
        dayType: entry.dayType || 'Push',
        exercise: entry.exercise || LIFT_EXERCISES[0],
        weight: entry.weight ?? 0,
        sets: entry.sets ?? 3,
        reps: entry.reps ?? 8,
        rpe: entry.rpe ?? 7,
        notes: entry.notes || '',
      });
    } else {
      resetLiftForm();
    }
    setLiftOpen(true);
  }
  async function saveLift() {
    const method = editingLiftId ? 'PUT' : 'POST';
    const url = editingLiftId ? `/api/logs/lift/${editingLiftId}` : '/api/logs/lift';
    const ok = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(lift) })
      .then(r=>r.ok).catch(()=>false);
    if (ok) { toast({ title: editingLiftId?'Lift updated':'Lift saved', description: 'Entry stored successfully.' }); setLiftOpen(false); resetLiftForm(); loadRecent(); }
    else { toast({ title:'Error', description:'Could not save lift.' }); }
  }
  async function deleteLift(id: number) {
    const ok = await fetch(`/api/logs/lift/${id}`, { method:'DELETE' }).then(r=>r.ok).catch(()=>false);
    if (ok) { toast({ title:'Lift deleted', description:'Entry removed.' }); loadRecent(); }
    else { toast({ title:'Error', description:'Could not delete lift.' }); }
  }

  // Deep-link edit (?editRunId / ?editLiftId)
  useEffect(() => {
    const u = new URL(window.location.href);
    const er = u.searchParams.get('editRunId');
    const el = u.searchParams.get('editLiftId');
    if (er) {
      const id = Number(er);
      const found = recentRuns.find((x) => x.id === id);
      if (found) openRunEditor(found);
    }
    if (el) {
      const id = Number(el);
      const found = recentLifts.find((x) => x.id === id);
      if (found) openLiftEditor(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentRuns, recentLifts]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      <div className="grid gap-4">
        <Tabs defaultValue="run">
          <TabsList>
            <TabsTrigger value="run">Run</TabsTrigger>
            <TabsTrigger value="lift">Lift</TabsTrigger>
          </TabsList>

          {/* ---------- RUN TAB ---------- */}
          <TabsContent value="run">
            <Card
              title="Today’s Pace Bands"
              subtitle={`Adjusted for ${tempF}°F / ${humidityPct}% humidity + recent RPE`}
              className="mb-6"
            >
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Base</th>
                      <th>Today (Adj)</th>
                      <th>Aggressive</th>
                      <th>Conservative</th>
                      <th>RPE Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paceRows.map(r => (
                      <tr key={r.name}>
                        <td className="p-2">{r.name}</td>
                        <td className="p-2">{r.base}</td>
                        <td className="p-2"><span className="pill">{r.today || '-'}</span></td>
                        <td className="p-2">{r.aggressive}</td>
                        <td className="p-2">{r.conservative}</td>
                        <td className="p-2">
                          {r.rpeDeltaSec === 0 ? <span className="pill">0s</span>
                            : r.rpeDeltaSec > 0 ? <span className="pill">+{r.rpeDeltaSec}s</span>
                            : <span className="pill">{r.rpeDeltaSec}s</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mb-8">
              <Card title="Log or Edit a Run">
                <div className="flex flex-wrap gap-2">
                  <button className="btn" onClick={() => openRunEditor()}>New Run</button>
                </div>
              </Card>
            </div>

            <div className="mt-8">
              <Card title="Recent Runs">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Type</th><th>Mi</th><th>Pace</th><th>RPE</th><th>Notes</th><th className="w-px"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRuns.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="p-2">{new Date(r.logDate).toISOString().slice(0, 10)}</td>
                          <td className="p-2">{r.runType}</td>
                          <td className="p-2">{r.actualDistance ?? ''}</td>
                          <td className="p-2">{r.actualPace ?? ''}</td>
                          <td className="p-2">{r.rpe ?? ''}</td>
                          <td className="p-2 max-w-[280px] truncate sm:whitespace-normal sm:max-w-none">{r.notes ?? ''}</td>
                          <td className="p-2 whitespace-nowrap">
                            <button className="btn mr-2" onClick={() => openRunEditor(r as any)}>Edit</button>
                            <button className="btn" onClick={() => deleteRun(r.id!)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {recentRuns.length === 0 && (
                        <tr><td colSpan={7} className="p-2 text-sm text-gray-500">No runs yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ---------- LIFT TAB ---------- */}
          <TabsContent value="lift">
            <Card
              title="Today’s Lift Recommendations"
              subtitle="Based on your recent RPE trends and starting weights"
              className="mb-6"
            >
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Exercise</th>
                      <th>Last</th>
                      <th>Today (Rec)</th>
                      <th>Aggressive</th>
                      <th>Conservative</th>
                      <th>RPE Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liftRecs.map((rec) => (
                      <tr key={rec.exercise}>
                        <td className="p-2">{rec.exercise}</td>
                        <td className="p-2">{rec.last ?? '-'}</td>
                        <td className="p-2"><span className="pill">{rec.today}</span></td>
                        <td className="p-2">{rec.aggressive}</td>
                        <td className="p-2">{rec.conservative}</td>
                        <td className="p-2">
                          {rec.rpeDeltaLbs === 0 ? <span className="pill">0 lb</span>
                            : rec.rpeDeltaLbs > 0 ? <span className="pill">+{rec.rpeDeltaLbs} lb</span>
                            : <span className="pill">{rec.rpeDeltaLbs} lb</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mb-8">
              <Card title="Log or Edit a Lift">
                <div className="flex flex-wrap gap-2">
                  <button className="btn" onClick={() => openLiftEditor()}>New Lift</button>
                </div>
              </Card>
            </div>

            <div className="mt-8">
              <Card title="Recent Lifts">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Day</th><th>Exercise</th><th>Weight/Assist</th><th>Sets×Reps</th><th>RPE</th><th>Notes</th><th className="w-px"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLifts.map((l) => (
                        <tr key={l.id} className="border-t">
                          <td className="p-2">{new Date(l.logDate).toISOString().slice(0, 10)}</td>
                          <td className="p-2">{l.dayType}</td>
                          <td className="p-2">{l.exercise}</td>
                          <td className="p-2">{l.weight ?? ''}</td>
                          <td className="p-2">{(l.sets ?? 0)}×{(l.reps ?? 0)}</td>
                          <td className="p-2">{l.rpe ?? ''}</td>
                          <td className="p-2 max-w-[280px] truncate sm:whitespace-normal sm:max-w-none">{l.notes ?? ''}</td>
                          <td className="p-2 whitespace-nowrap">
                            <button className="btn mr-2" onClick={() => openLiftEditor(l as any)}>Edit</button>
                            <button className="btn" onClick={() => deleteLift(l.id!)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {recentLifts.length === 0 && (
                        <tr><td colSpan={8} className="p-2 text-sm text-gray-500">No lifts yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------- RUN MODAL ---------- */}
      <Modal
        open={runOpen}
        onClose={() => { setRunOpen(false); }}
        title={editingRunId ? 'Edit Run' : 'Log Run'}
        maxWidthClass="max-w-2xl"
      >
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label className="text-sm">Date
            <input type="date" className="input" value={run.logDate} onChange={(e) => setRunField('logDate', e.target.value)} />
          </label>
          <label className="text-sm">Type
            <select className="input" value={run.runType || 'Easy'} onChange={(e) => setRunField('runType', e.target.value)}>
              {RUN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              {/* Consider ensuring RUN_TYPES includes "Medium" for logging consistency */}
            </select>
          </label>
          <label className="text-sm">Distance (mi)
            <input className="input" type="number" step="0.01" value={run.actualDistance ?? 0} onChange={(e) => setRunField('actualDistance', parseFloat(e.target.value || '0'))} />
          </label>
          <label className="text-sm">Pace (mm:ss)
            <input className="input" value={run.actualPace || ''} onChange={(e) => setRunField('actualPace', e.target.value)} />
          </label>
          <label className="text-sm">RPE (1–10)
            <input className="input" type="number" min={1} max={10} value={run.rpe ?? 7} onChange={(e) => setRunField('rpe', parseInt(e.target.value || '7', 10))} />
          </label>
          <label className="text-sm sm:col-span-2">Notes
            <textarea className="input" rows={3} value={run.notes || ''} onChange={(e) => setRunField('notes', e.target.value)} />
          </label>
        </div>
        <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <button className="btn" onClick={() => { setRunOpen(false); resetRunForm(); }}>Cancel</button>
          <button className="btn" onClick={saveRun}>{editingRunId ? 'Update' : 'Save'}</button>
        </div>
      </Modal>

      {/* ---------- LIFT MODAL ---------- */}
      <Modal
        open={liftOpen}
        onClose={() => { setLiftOpen(false); }}
        title={editingLiftId ? 'Edit Lift' : 'Log Lift'}
        maxWidthClass="max-w-xl"
      >
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <label className="text-sm">Date
            <input type="date" className="input" value={lift.logDate} onChange={(e) => setLiftField('logDate', e.target.value)} />
          </label>
          <label className="text-sm">Day
            <select className="input" value={lift.dayType || 'Push'} onChange={(e) => setLiftField('dayType', e.target.value)}>
              <option>Push</option><option>Pull</option><option>Legs</option>
            </select>
          </label>
          <label className="text-sm">Exercise
            <select className="input" value={lift.exercise || LIFT_EXERCISES[0]} onChange={(e) => setLiftField('exercise', e.target.value)}>
              {LIFT_EXERCISES.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </label>
          <label className="text-sm">Weight (lb) / Assist
            <input type="number" className="input" value={lift.weight ?? 0} onChange={(e) => setLiftField('weight', parseFloat(e.target.value || '0'))} />
          </label>
          <label className="text-sm">Sets
            <input type="number" className="input" value={lift.sets ?? 3} onChange={(e) => setLiftField('sets', parseInt(e.target.value || '3', 10))} />
          </label>
          <label className="text-sm">Reps
            <input type="number" className="input" value={lift.reps ?? 8} onChange={(e) => setLiftField('reps', parseInt(e.target.value || '8', 10))} />
          </label>
          <label className="text-sm sm:col-span-2">RPE (1–10)
            <input type="number" className="input" min={1} max={10} value={lift.rpe ?? 7} onChange={(e) => setLiftField('rpe', parseInt(e.target.value || '7', 10))} />
          </label>
          <label className="text-sm sm:col-span-2">Notes
            <textarea className="input" rows={3} value={lift.notes || ''} onChange={(e) => setLiftField('notes', e.target.value)} />
          </label>
        </div>
        <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <button className="btn" onClick={() => { setLiftOpen(false); resetLiftForm(); }}>Cancel</button>
          <button className="btn" onClick={saveLift}>{editingLiftId ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </motion.div>
  );
}
