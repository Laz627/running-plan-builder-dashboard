// /app/api/logs/history/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Query params (all optional):
 *  - from: ISO date (inclusive)
 *  - to:   ISO date (inclusive)
 *  - type: "run" | "lift" | "all" (default = "all")
 *  - limit: number (default 60)
 *  - offset: number (default 0)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'all').toLowerCase();
    const limit = Math.min(Number(searchParams.get('limit') || 60), 500);
    const offset = Math.max(Number(searchParams.get('offset') || 0), 0);

    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : null;
    const toParam = searchParams.get('to') ? new Date(searchParams.get('to')!) : null;
    // include entire end day
    const to = toParam ? new Date(toParam.getTime() + 24 * 60 * 60 * 1000 - 1) : null;

    const runWhere: any = {};
    const liftWhere: any = {};
    if (from || to) {
      runWhere.logDate = {};
      liftWhere.logDate = {};
      if (from) { runWhere.logDate.gte = from; liftWhere.logDate.gte = from; }
      if (to)   { runWhere.logDate.lte = to;   liftWhere.logDate.lte = to; }
    }

    let runs: any[] = [];
    let lifts: any[] = [];

    if (type === 'run' || type === 'all') {
      runs = await prisma.runLog.findMany({
        where: runWhere,
        orderBy: { logDate: 'desc' },
        take: limit,
        skip: offset,
      });
    }

    if (type === 'lift' || type === 'all') {
      lifts = await prisma.liftLog.findMany({
        where: liftWhere,
        orderBy: { logDate: 'desc' },
        take: limit,
        skip: offset,
      });
    }

    return NextResponse.json({ runs, lifts }, { status: 200 });
  } catch (e: any) {
    console.error('GET /api/logs/history', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
