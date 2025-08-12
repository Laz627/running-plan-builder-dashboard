// /app/api/logs/run/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSetting, setSettings } from '@/lib/settings';
import { nextPace } from '@/lib/progression';

const prisma = new PrismaClient();

type RunPayload = {
  logDate: string;           // ISO
  runType?: string | null;   // 'Tempo' | 'MP' | 'Easy' | 'Recovery' | 'Speed'
  plannedDesc?: string | null;
  targetPaceCool?: string | null;
  targetPaceHeat?: string | null;
  actualDistance?: number | null;
  actualPace?: string | null;   // "mm:ss"
  rpe?: number | null;
  notes?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RunPayload;

    // 1) Save the log
    const saved = await prisma.runLog.create({
      data: {
        logDate: new Date(body.logDate ?? new Date().toISOString()),
        runType: body.runType ?? null,
        plannedDesc: body.plannedDesc ?? null,
        targetPaceCool: body.targetPaceCool ?? null,
        targetPaceHeat: body.targetPaceHeat ?? null,
        actualDistance: body.actualDistance ?? null,
        actualPace: body.actualPace ?? null,
        rpe: body.rpe ?? null,
        notes: body.notes ?? null,
      },
    });

    // 2) Auto-adjust: update the corresponding base pace in settings
    // Only adjust for steady-state types where a single pace makes sense.
    const type = (body.runType || '').toLowerCase();
    const rpe = body.rpe ?? 7;

    // Map run type → settings key
    let key: string | null = null;
    if (type.includes('tempo')) key = 'tempo_base';
    else if (type.includes('recovery')) key = 'recovery_base';
    else if (type === 'easy' || type.includes('easy')) key = 'easy_base';
    else if (type.includes('mp')) key = 'goal_mp';
    // we skip 'Speed' because intervals vary and pace often isn’t a single mm:ss

    if (key) {
      const cur = await getSetting(key, '');
      if (cur) {
        const next = nextPace(cur, rpe);
        await setSettings({ [key]: next });
      }
    }

    return NextResponse.json({ ok: true, saved }, { status: 200 });
  } catch (e: any) {
    console.error('POST /api/logs/run', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
