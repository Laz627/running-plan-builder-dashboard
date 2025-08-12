// /lib/settings.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Load all settings as a simple object
export async function loadSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const obj: Record<string, string> = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
}

// Get a single key (with default fallback)
export async function getSetting(key: string, fallback = ''): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

// Upsert one setting (stringify non-strings)
export async function setSetting(key: string, value: string | number | boolean) {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: String(value) },
    update: { value: String(value) },
  });
}

// Upsert many
export async function setSettings(pairs: Record<string, string | number | boolean>) {
  await Promise.all(Object.entries(pairs).map(([k, v]) => setSetting(k, v)));
}
