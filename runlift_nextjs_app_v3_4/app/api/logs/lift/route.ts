// /app/api/logs/lift/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { loadSettings, setSettings } from '@/lib/settings';
import { nextWeight, num } from '@/lib/progression';

const prisma = new PrismaClient();

// Map input exercise name → settings keys and metadata
// Edit the keys to match your settings field names as needed.
const LIFT_MAP: Record<
  string,
  { key: string; region: 'upper' | 'lower'; assisted?: boolean }
> = {
  'Incline Chest Press (Machine)': { key: 'start_incline', region: 'upper' },
  'Shoulder Press (Machine)': { key: 'start_shoulder', region: 'upper' },
  'Assisted Chest Dips': { key: 'start_dips', region: 'upper', assisted: true },

  'Seated Rows (Machine)': { key: 'start_rows', region: 'upper' },
  'Assisted Pull-ups/Chin-ups': { key: 'start_pu', region: 'upper', assisted: true },
  'Lat Pulldowns (Machine)': { key: 'start_lat', region: 'upper' },

  'Leg Press (Machine)': { key: 'start_legpress', region: 'lower' },
  'Hamstring Curl (Machine)': { key: 'start_ham', region: 'lower' },
  'Calf Raises (Machine)': { key: 'start_calf', region: 'lower' },
  'Ab Work (Minor)': { key: 'start_abs', region: 'lower' }, // not used, harmless
};

type LiftPayload = {
  logDate: string;         // ISO
  dayType?: string | null; // Push | Pull | Legs | etc
  exercise?: string | null;
  weight?: number | null;  // for assisted: assistance weight
  sets?: number | null;    // assumed 3
  reps?: number | null;    // assumed 8
  rpe?: number | null;     // 1-10
  notes?: string | null;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LiftPayload;

    // 1) Save the log
    const saved = await prisma.liftLog.create({
      data: {
        logDate: new Date(body.logDate ?? new Date().toISOString()),
        dayType: body.dayType ?? null,
        exercise: body.exercise ?? null,
        weight: body.weight ?? null,
        sets: body.sets ?? 3,
        reps: body.reps ?? 8,
        rpe: body.rpe ?? null,
        notes: body.notes ?? null,
      },
    });

    // 2) Auto-adjust that exercise's stored target for next time
    const s = await loadSettings();
    const incUpper = num(s.inc_upper, 5);
    const incLower = num(s.inc_lower, 10);
    const incAssist = num(s.inc_assist, 5);

    const name = (body.exercise || '').trim();
    const meta = LIFT_MAP[name];

    if (meta) {
      const current = num(s[meta.key], body.weight ?? 0);
      const rpe = body.rpe ?? 7;
      const next = nextWeight(current, rpe, meta.region, !!meta.assisted, incUpper, incLower, incAssist);

      // Persist back to settings so UI uses the updated target automatically
      await setSettings({ [meta.key]: next });
    }

    return NextResponse.json({ ok: true, saved }, { status: 200 });
  } catch (e: any) {
    console.error('POST /api/logs/lift', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
