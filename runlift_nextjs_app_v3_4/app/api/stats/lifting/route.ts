// app/api/stats/lifting/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Ex = { name: string; key: string; start: number; region: 'upper'|'lower'; assisted?: boolean };

function num(v: any, f: number) { const n = Number(v); return Number.isFinite(n) ? n : f; }

function buildWeeks(exs: Ex[], incUpper:number, incLower:number, incAssist:number) {
  const weeks = Array.from({length:12}, (_,i)=>i+1);
  const rows = exs.map(ex => {
    const w:number[] = [];
    let cur = ex.start;
    weeks.forEach(()=>{
      w.push(cur);
      if (ex.assisted) cur = Math.max(0, cur - incAssist);
      else cur = cur + (ex.region === 'lower' ? incLower : incUpper);
    });
    return { name: ex.name, weights: w };
  });
  return { weeks, rows };
}

export async function GET() {
  try {
    // SETTINGS
    const settingsRows = await prisma.setting.findMany();
    const S: Record<string,string> = {};
    settingsRows.forEach(r => S[r.key] = r.value);

    const incUpper = num(S['inc_upper'], 5);
    const incLower = num(S['inc_lower'], 10);
    const incAssist = num(S['inc_assist'], 5);

    const push: Ex[] = [
      { name:'Incline Chest Press (Machine)', key:'start_incline',  start:num(S['start_incline'],35), region:'upper' },
      { name:'Shoulder Press (Machine)',      key:'start_shoulder', start:num(S['start_shoulder'],35), region:'upper' },
      { name:'Assisted Chest Dips',           key:'start_dips',     start:num(S['start_dips'],60), region:'upper', assisted:true },
    ];
    const pull: Ex[] = [
      { name:'Seated Rows (Machine)',         key:'start_rows', start:num(S['start_rows'],90), region:'upper' },
      { name:'Assisted Pull-ups/Chin-ups',    key:'start_pu',   start:num(S['start_pu'],60), region:'upper', assisted:true },
      { name:'Lat Pulldowns (Machine)',       key:'start_lat',  start:num(S['start_lat'],75), region:'upper' },
    ];
    const legs: Ex[] = [
      { name:'Leg Press (Machine)',           key:'start_legpress', start:num(S['start_legpress'],160), region:'lower' },
      { name:'Hamstring Curl (Machine)',      key:'start_ham',      start:num(S['start_ham'],60), region:'lower' },
      { name:'Calf Raises (Machine)',         key:'start_calf',     start:num(S['start_calf'],45), region:'lower' },
    ];

    const all = [...push, ...pull, ...legs];

    // PLANNED weekly volume = sum(weight * 3 * 8) across planned targets
    const plan = buildWeeks(all, incUpper, incLower, incAssist);
    const plannedWeekly = plan.weeks.map((wIdx) => {
      let vol = 0;
      for (const row of plan.rows) {
        const wt = row.weights[wIdx-1] || 0;
        if (wt > 0) vol += wt * 3 * 8;
      }
      return vol;
    });

    // START DATE
    const start = S['start_date'] ? new Date(S['start_date']) : new Date();

    // ACTUAL volume by week from lift_logs
    const lifts = await prisma.liftLog.findMany({});
    const actualByWeek = new Map<number, number>();
    for (const l of lifts) {
      const d = new Date(l.logDate);
      const days = Math.floor((d.getTime() - start.getTime()) / (1000*60*60*24));
      const wk = Math.floor(days / 7) + 1;
      if (wk < 1 || wk > 52) continue;
      const thisVol = (l.weight ?? 0) * (l.sets ?? 0) * (l.reps ?? 0);
      actualByWeek.set(wk, (actualByWeek.get(wk) || 0) + thisVol);
    }

    const weekly = plan.weeks.map(wk => ({
      week: wk,
      planned: plannedWeekly[wk-1] || 0,
      actual: actualByWeek.get(wk) || 0
    }));

    // Per-exercise progress series
    // target: weekly target on a notional date (start + 7*(week-1))
    // actual: actual session points on real dates
    const series: Record<string, { date: string; target?: number; actual?: number }[]> = {};
    for (const row of plan.rows) {
      series[row.name] = plan.weeks.map((wk, i)=>({
        date: new Date(start.getTime() + (i*7)*24*60*60*1000).toISOString().slice(0,10),
        target: row.weights[i] || 0
      }));
    }
    for (const l of lifts) {
      const name = l.exercise || '';
      if (!series[name]) series[name] = [];
      series[name].push({
        date: new Date(l.logDate).toISOString().slice(0,10),
        actual: l.weight ?? 0
      });
    }

    return NextResponse.json({ weekly, series }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/stats/lifting', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
