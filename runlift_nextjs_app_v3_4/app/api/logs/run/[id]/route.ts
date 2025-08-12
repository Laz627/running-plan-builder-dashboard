// /app/api/logs/run/[id]/route.ts
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

    const updated = await prisma.runLog.update({
      where: { id },
      data: {
        logDate: body.logDate ? new Date(body.logDate) : undefined,
        runType: body.runType ?? undefined,
        plannedDesc: body.plannedDesc ?? undefined,
        targetPaceCool: body.targetPaceCool ?? undefined,
        targetPaceHeat: body.targetPaceHeat ?? undefined,
        actualDistance: body.actualDistance ?? undefined,
        actualPace: body.actualPace ?? undefined,
        rpe: body.rpe ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    return NextResponse.json({ ok: true, updated }, { status: 200 });
  } catch (e: any) {
    console.error('PUT /api/logs/run/[id]', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    await prisma.runLog.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error('DELETE /api/logs/run/[id]', e);
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 });
  }
}
