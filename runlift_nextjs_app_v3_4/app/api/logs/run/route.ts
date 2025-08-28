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

/** Body shape from EditRunModal */
type RunPayload = {
  logDate: string;
  runType?: string | null;        // 'Tempo' | 'MP' | 'Easy' | 'Recovery' | 'Speed'
  plannedDesc?: string | null;
  targetPaceCool?: string | null; // "mm:ss"
  targetPaceHeat?: string | null; // "mm:ss"
  actualDistance?: number | null; // miles
  actualPace?: string | null;     // "mm:ss"
  rpe?: number | null;            // 1–10
  notes?: string | null;
};

/** Map UI run type to the baseline settings key */
function keyForType(runType: string | null | undefined): string | null {
  if (!runType) return null;
  const t = runType.toLowerCase();
  if (t.includes('tempo')) return 'tempo_base';
  if (t.includes('recovery')) return 'recovery_base';
  if (t.includes('speed') || t.includes('interval')) return 'speed_base';
  if (t === 'easy' || t.includes('easy')) return 'easy_base';
  if (t.includes('mp') || t.includes('marathon')) return 'goal_mp';
  return null;
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

    // 2) Per-type pace *adjustment* (do NOT mutate the baseline)
    const rpe = body.rpe ?? 7;
    const typeKey = keyForType(body.runType);

    if (typeKey) {
      const baselineKey = `${typeKey}`;      // e.g., 'easy_base'
      const adjKey = `${typeKey}_adj`;       // e.g., 'easy_base_adj' (seconds)

      const baseline = await getSetting(baselineKey, '0:00');
      const currentAdj = num(await getSetting(adjKey, '0'), 0);

      // Compute next cumulative adjustment (capped/controlled)
      const nextAdj = nextAdjustmentSeconds(currentAdj, rpe);

      // Derive today's pace from baseline + adjustment (not persisted as baseline)
      const _todayPace = adjustedPaceFromBaseline(baseline, nextAdj);

      // Persist ONLY the adjustment; keep baseline user-controlled in Settings.
      await setSettings({
        [adjKey]: String(nextAdj),
      });
    }

    return NextResponse.json({ ok: true, saved }, { status: 200 });
  } catch (e: any) {
    console.error('POST /api/logs/run', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
