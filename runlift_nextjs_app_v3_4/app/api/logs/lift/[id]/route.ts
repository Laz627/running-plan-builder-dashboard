// /app/api/logs/lift/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    const updated = await prisma.liftLog.update({
      where: { id },
      data: {
        logDate: body.logDate ? new Date(body.logDate) : undefined,
        dayType: body.dayType ?? undefined,
        exercise: body.exercise ?? undefined,
        weight: body.weight ?? undefined,
        sets: body.sets ?? undefined,
        reps: body.reps ?? undefined,
        rpe: body.rpe ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, updated }, { status: 200 });
  } catch (e: any) {
    console.error('PUT /api/logs/lift/[id]', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    await prisma.liftLog.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error('DELETE /api/logs/lift/[id]', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
