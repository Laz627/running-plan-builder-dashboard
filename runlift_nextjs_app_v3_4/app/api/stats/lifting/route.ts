// app/api/stats/running/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function defaultPlan(): string[][] {
  return [
    ['ER 5 mi (Easy)','TR 5–6 mi (Tempo)','MR 6–7 mi (Easy)','SR 5 mi (8×400m)','ER 5 mi (Easy)','LR 8–10 mi (Easy)','Rest'],
    ['ER 5 mi (Easy)','TR 5–6 mi (Tempo)','MR 6–7 mi (Easy)','SR 5 mi (8×400m)','ER 5 mi (Easy)','LR 8–10 mi (Easy)','Rest'],
    ['ER 5 mi (Easy)','TR 5–6 mi (Tempo)','MR 6–7 mi (Easy)','SR 5 mi (8×400m)','ER 5 mi (Easy)','LR 9–11 mi (Easy)','Rest'],
    ['ER 5 mi (Easy)','TR 5–6 mi (Tempo)','MR 6–7 mi (Easy)','SR 5 mi (8×400m)','ER 5 mi (Easy)','LR 10 mi (Easy)','Rest'],
    ['ER 5 mi (Easy)','TR 7 mi (Tempo)','MR 8 mi (Last 2 @ MP)','SR 6 mi (6×800m)','ER 5 mi (Easy)','LR 12 mi (Last 3 @ MP)','Rest'],
    ['ER 5 mi (Easy)','TR 7 mi (Tempo)','MR 8 mi (Last 2 @ MP)','SR 6 mi (6×800m)','ER 5 mi (Easy)','LR 13 mi (Last 3 @ MP)','Rest'],
    ['ER 5 mi (Easy)','TR 7 mi (Tempo)','MR 8 mi (Last 2 @ MP)','SR 6 mi (6×800m)','ER 5 mi (Easy)','LR 14 mi (Last 3 @ MP)','Rest'],
    ['ER 5 mi (Easy)','TR 7 mi (Tempo)','MR 8 mi (Last 2 @ MP)','SR 6 mi (6×800m)','ER 5 mi (Easy)','LR 15 mi (Last 3 @ MP)','Rest'],
    ['ER 5 mi (Easy)','TR 8 mi (Tempo)','MR 9 mi (Last 3 @ MP)','SR 6 mi (10×400m)','ER 5 mi (Easy)','LR 18 mi (Last 4 @ MP)','Rest'],
    ['ER 5 mi (Easy)','TR 8 mi (Tempo)','MR 9 mi (Last 3 @ MP)','SR 6 mi (10×400m)','ER 5 mi (Easy)','LR 20 mi (Last 4 @ MP)','Rest'],
    ['ER 4 mi (Easy)','TR 5 mi (Tempo)','MR 6 mi (Easy)','SR 4 mi (6×400m)','ER 4 mi (Easy)','LR 10–12 mi (Easy)','Rest'],
    ['ER 4 mi (Easy)','TR 5 mi (Tempo)','MR 6 mi (Easy)','SR 4 mi (6×400m)','ER 4 mi (Easy)','LR 6 mi (Easy)','Rest'],
  ];
}

function miles(desc: string) {
  const nums = desc.replace('–','-').match(/\d+/g);
  if (!nums) return 0;
  if (desc.includes('–') || desc.includes('-')) {
    const parts = desc.split(/–|-/);
    const vals = parts.map(p => parseFloat(p.match(/\d+/)?.[0] || '0')).filter(Boolean);
    if (vals.length >= 2) return (vals[0] + vals[1]) / 2;
  }
  return parseFloat(nums[0]);
}

function weekIndex(d: Date, start: Date) {
  const ms = d.getTime() - start.getTime();
  const days = Math.floor(ms / (1000*60*60*24));
  return Math.floor(days / 7) + 1; // week 1-based
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : null;
    const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : null;

    // SETTINGS: start_date and custom_plan_json
    const settingsRows = await prisma.setting.findMany();
    const S: Record<string, string> = {};
    settingsRows.forEach(r => (S[r.key] = r.value));

    const start = S['start_date'] ? new Date(S['start_date']) : new Date();
    let plan = defaultPlan();
    if (S['custom_plan_json']) {
      try { plan = JSON.parse(S['custom_plan_json']); } catch {}
    }

    // PLANNED weekly mileage (12 weeks)
    const plannedWeekly = plan.map(week => week.reduce((acc, d) => acc + (d.includes('Rest') ? 0 : miles(d)), 0));

    // ACTUAL runs by week index relative to start_date
    const where: any = {};
    if (from || to) {
      where.logDate = {};
      if (from) where.logDate.gte = from;
      if (to)   where.logDate.lte = to;
    }
    const runs = await prisma.runLog.findMany({ where });

    const actualByWeek = new Map<number, number>();
    for (const r of runs) {
      const idx = weekIndex(new Date(r.logDate), start);
      if (idx < 1 || idx > 52) continue; // guard
      const prev = actualByWeek.get(idx) || 0;
      actualByWeek.set(idx, prev + (r.actualDistance ?? 0));
    }

    const weekly = plannedWeekly.map((planned, i) => {
      const wk = i + 1;
      const actual = actualByWeek.get(wk) || 0;
      return { week: wk, planned, actual };
    });

    // For optional scatter: day-level actual pace and RPE
    const byDay = runs
      .map(r => ({
        date: new Date(r.logDate).toISOString(),
        type: r.runType || '',
        actualPace: r.actualPace || '',
        rpe: r.rpe ?? null,
        distance: r.actualDistance ?? null,
      }))
      .sort((a,b)=> (a.date < b.date ? -1 : 1));

    return NextResponse.json({ weekly, byDay }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/stats/running', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
