
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const settings = await prisma.setting.findMany();
  const obj: Record<string,string> = {};
  settings.forEach(s => obj[s.key] = s.value);
  return NextResponse.json(obj);
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const entries = Object.entries(data) as [string,string][];
  await Promise.all(entries.map(([key, value]) =>
    prisma.setting.upsert({ where:{key}, update:{value}, create:{key, value} })
  ));
  return NextResponse.json({ok:true});
}
