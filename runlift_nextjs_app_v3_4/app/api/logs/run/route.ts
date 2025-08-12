// /app/api/logs/run/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSetting, setSettings } from '@/lib/settings';
import {
  adjustedPaceFromBaseline,
  nextAdjustmentSeconds,
  num,
} from '@/lib/progression';

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

// map runType → main pace key in settings
function keyForType(type: string): string | null {
  const t = type.toLowerCase();
  if (t.includes('tempo')) return 'tempo_base';
  if (t.includes('recovery')) return 'recovery_base';
  if (t === 'easy' || t.includes('easy')) return 'easy_base';
  if (t.includes('mp')) return 'goal_mp';
  return null; // skip 'speed' etc.
}

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

    // 2) Auto-adjust pacing for the *next workout of the same type*
    const rpe = body.rpe ?? 7;
    const typeKey = body.runType ? keyForType(body.runType) : null;

    if (typeKey) {
      const baseKey = typeKey;                        // e.g., 'tempo_base'
      const baselineKey = `${typeKey}_baseline`;      // e.g., 'tempo_base_baseline'
      const adjKey = `${typeKey}_adj`;                // e.g., 'tempo_base_adj' (seconds)

      // Get current values
      const curr = await getSetting(baseKey, '');
      let baseline = await getSetting(baselineKey, '');
      if (!baseline && curr) {
        // First time: seed the baseline with current
        baseline = curr;
        await setSettings({ [baselineKey]: baseline });
      }

      // If still no baseline, we can't adjust safely
      if (baseline) {
        const currAdj = num(await getSetting(adjKey, '0'), 0);
        const nextAdj = nextAdjustmentSeconds(currAdj, rpe);
        const nextPace = adjustedPaceFromBaseline(baseline, nextAdj);

        await setSettings({
          [adjKey]: String(nextAdj), // persist cumulative adjustment (seconds)
          [baseKey]: nextPace,       // keep UI compatible: store adjusted pace in the usual key
        });
      }
    }

    return NextResponse.json({ ok: true, saved }, { status: 200 });
  } catch (e: any) {
    console.error('POST /api/logs/run', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
