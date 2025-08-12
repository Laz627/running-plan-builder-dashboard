
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.runLog.create({
    data: {
      logDate: new Date(body.logDate),
      runType: body.runType,
      plannedDesc: body.plannedDesc,
      targetPaceCool: body.targetPaceCool,
      targetPaceHeat: body.targetPaceHeat,
      actualDistance: body.actualDistance ?? null,
      actualPace: body.actualPace ?? null,
      rpe: body.rpe ?? null,
      notes: body.notes ?? null
    }
  });
  return NextResponse.json(item);
}
