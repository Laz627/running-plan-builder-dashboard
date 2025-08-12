'use client';

import Fade from '@/components/Fade';
import Card from '@/components/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs';
import { useEffect, useMemo, useState } from 'react';

type RunLog = {
  id: number;
  logDate: string;
  runType?: string | null;
  plannedDesc?: string | null;
  targetPaceCool?: string | null;
  targetPaceHeat?: string | null;
  actualDistance?: number | null;
  actualPace?: string | null;
  rpe?: number | null;
  notes?: string | null;
};

type LiftLog = {
  id: number;
  logDate: string;
  dayType?: string | null;
  exercise?: string | null;
  weight?: number | null;
  sets?: number | null;
  reps?: number | null;
  rpe?: number | null;
  notes?: string | null;
};

function fmtDate(s: string) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function toCSV(rows: any[], headers: string[]): string {
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = headers.join(',');
  const body = rows.map(r => headers.map(h => esc(r[h])).join(',')).join('\n');
  return `${head}\n${body}`;
}

export default function HistoryPage() {
  const [type, setType] = useState<'all' | 'run' | 'lift'>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [lifts, setLifts] = useState<LiftLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('type', type);
    params.set('limit', '200');
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/api/logs/history?${params.toString()}`);
    const data = await res.json();
    setRuns(data.runs || []);
    setLifts(data.lifts || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [type]);

  const filteredRuns = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return runs;
    return runs.filter(r =>
      (r.runType || '').toLowerCase().includes(qq) ||
      (r.plannedDesc || '').toLowerCase().includes(qq) ||
      (r.notes || '').toLowerCase().includes(qq)
    );
  }, [runs, q]);

  const filteredLifts = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return lifts;
    return lifts.filter(l =>
      (l.dayType || '').toLowerCase().includes(qq) ||
      (l.exercise || '').toLowerCase().includes(qq) ||
      (l.notes || '').toLowerCase().includes(qq)
    );
  }, [lifts, q]);

  function exportRuns() {
    const headers = ['date', 'type', 'planned', 'targetCool', 'targetHeat', 'distance', 'pace', 'rpe', 'notes'];
    const rows = filteredRuns.map(r => ({
      date: fmtDate(r.logDate),
      type: r.runType || '',
      planned: r.plannedDesc || '',
      targetCool: r.targetPaceCool || '',
      targetHeat: r.targetPaceHeat || '',
      distance: r.actualDistance ?? '',
      pace: r.actualPace || '',
      rpe: r.rpe ?? '',
      notes: r.notes || '',
    }));
    const blob = new Blob([toCSV(rows, headers)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `runs_history.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function exportLifts() {
    const headers = ['date', 'day', 'exercise', 'weight', 'sets', 'reps', 'rpe', 'notes'];
    const rows = filteredLifts.map(l => ({
      date: fmtDate(l.logDate),
      day: l.dayType || '',
      exercise: l.exercise || '',
      weight: l.weight ?? '',
      sets: l.sets ?? '',
      reps: l.reps ?? '',
      rpe: l.rpe ?? '',
      notes: l.notes || '',
    }));
    const blob = new Blob([toCSV(rows, headers)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `lifts_history.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Fade>
      <div className="grid gap-4">
        <Card title="Filters">
          <div className="grid gap-3 sm:grid-cols-5">
            <label className="text-sm col-span-2">
              From
              <input
                type="date"
                className="input"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="text-sm col-span-2">
              To
              <input
                type="date"
                className="input"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                className="btn"
                onClick={() => load()}
                disabled={loading}
                aria-label="Apply filters"
              >
                {loading ? 'Loading…' : 'Apply'}
              </button>
            </div>
            <label className="text-sm sm:col-span-3">
              Search
              <input
                className="input"
                placeholder="tempo, leg press, notes…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
          </div>
        </Card>

        <Tabs defaultValue="all" onValueChange={(v) => setType(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="run">Runs</TabsTrigger>
            <TabsTrigger value="lift">Lifts</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card title="Recent Runs">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Type</th><th>Planned</th><th>Distance</th><th>Pace</th><th>RPE</th><th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRuns.map((r) => (
                      <tr key={`r-${r.id}`} className="border-t">
                        <td className="p-2">{fmtDate(r.logDate)}</td>
                        <td className="p-2">{r.runType || ''}</td>
                        <td className="p-2">{r.plannedDesc || ''}</td>
                        <td className="p-2">{r.actualDistance ?? ''}</td>
                        <td className="p-2">{r.actualPace || ''}</td>
                        <td className="p-2">{r.rpe ?? ''}</td>
                        <td className="p-2">{r.notes || ''}</td>
                      </tr>
                    ))}
                    {filteredRuns.length === 0 && (
                      <tr><td className="p-2 text-sm" colSpan={7}>No runs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn" onClick={exportRuns}>Export Runs CSV</button>
              </div>
            </Card>

            <div className="h-2" />

            <Card title="Recent Lifts">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Day</th><th>Exercise</th><th>Weight</th><th>Sets×Reps</th><th>RPE</th><th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLifts.map((l) => (
                      <tr key={`l-${l.id}`} className="border-t">
                        <td className="p-2">{fmtDate(l.logDate)}</td>
                        <td className="p-2">{l.dayType || ''}</td>
                        <td className="p-2">{l.exercise || ''}</td>
                        <td className="p-2">{l.weight ?? ''}</td>
                        <td className="p-2">{(l.sets ?? 0)}×{(l.reps ?? 0)}</td>
                        <td className="p-2">{l.rpe ?? ''}</td>
                        <td className="p-2">{l.notes || ''}</td>
                      </tr>
                    ))}
                    {filteredLifts.length === 0 && (
                      <tr><td className="p-2 text-sm" colSpan={7}>No lifts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn" onClick={exportLifts}>Export Lifts CSV</button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="run">
            <Card title="Runs">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Type</th><th>Planned</th><th>Distance</th><th>Pace</th><th>RPE</th><th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRuns.map((r) => (
                      <tr key={`r2-${r.id}`} className="border-t">
                        <td className="p-2">{fmtDate(r.logDate)}</td>
                        <td className="p-2">{r.runType || ''}</td>
                        <td className="p-2">{r.plannedDesc || ''}</td>
                        <td className="p-2">{r.actualDistance ?? ''}</td>
                        <td className="p-2">{r.actualPace || ''}</td>
                        <td className="p-2">{r.rpe ?? ''}</td>
                        <td className="p-2">{r.notes || ''}</td>
                      </tr>
                    ))}
                    {filteredRuns.length === 0 && (
                      <tr><td className="p-2 text-sm" colSpan={7}>No runs found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn" onClick={exportRuns}>Export Runs CSV</button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="lift">
            <Card title="Lifts">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th><th>Day</th><th>Exercise</th><th>Weight</th><th>Sets×Reps</th><th>RPE</th><th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLifts.map((l) => (
                      <tr key={`l2-${l.id}`} className="border-t">
                        <td className="p-2">{fmtDate(l.logDate)}</td>
                        <td className="p-2">{l.dayType || ''}</td>
                        <td className="p-2">{l.exercise || ''}</td>
                        <td className="p-2">{l.weight ?? ''}</td>
                        <td className="p-2">{(l.sets ?? 0)}×{(l.reps ?? 0)}</td>
                        <td className="p-2">{l.rpe ?? ''}</td>
                        <td className="p-2">{l.notes || ''}</td>
                      </tr>
                    ))}
                    {filteredLifts.length === 0 && (
                      <tr><td className="p-2 text-sm" colSpan={7}>No lifts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn" onClick={exportLifts}>Export Lifts CSV</button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Fade>
  );
}
