
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item = await prisma.liftLog.create({
    data: {
      logDate: new Date(body.logDate),
      dayType: body.dayType,
      exercise: body.exercise,
      weight: body.weight ?? null,
      sets: body.sets ?? null,
      reps: body.reps ?? null,
      rpe: body.rpe ?? null,
      notes: body.notes ?? null
    }
  });
  return NextResponse.json(item);
}
