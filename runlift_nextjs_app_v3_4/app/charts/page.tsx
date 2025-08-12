'use client';

import Fade from '@/components/Fade';
import Card from '@/components/Card';
import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter
} from 'recharts';

// ---------- helpers ----------
function paceToSec(p: string): number | null {
  const m = p?.trim().match(/^(\d+):([0-5]?\d)$/);
  if (!m) return null;
  return parseInt(m[1])*60 + parseInt(m[2]);
}
function secToMMSS(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s/60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

// ---------- types ----------
type WeeklyRow = { week: number; planned: number; actual: number };
type RunDay = { date: string; type: string; actualPace: string; rpe: number|null; distance: number|null };

// ---------- component ----------
export default function ChartsPage() {
  const [runWeekly, setRunWeekly] = useState<WeeklyRow[]>([]);
  const [runDays, setRunDays] = useState<RunDay[]>([]);
  const [liftWeekly, setLiftWeekly] = useState<WeeklyRow[]>([]);
  const [liftSeries, setLiftSeries] = useState<Record<string, { date: string; target?: number; actual?: number }[]>>({});
  const [exercise, setExercise] = useState<string>('');
  const [showPlanned, setShowPlanned] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async ()=>{
      try {
        const [r, l] = await Promise.all([
          fetch('/api/stats/running').then(r=>r.json()),
          fetch('/api/stats/lifting').then(r=>r.json()),
        ]);
        setRunWeekly(r.weekly || []);
        setRunDays(r.byDay || []);
        setLiftWeekly(l.weekly || []);
        setLiftSeries(l.series || {});
        const names = Object.keys(l.series || {});
        setExercise(prev => prev || (names[0] || 'Leg Press (Machine)'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // scatter: convert pace "mm:ss" to seconds
  const runScatter = useMemo(() => {
    return (runDays || [])
      .filter(d => d.actualPace)
      .map(d => {
        const y = paceToSec(d.actualPace);
        return y == null ? null : {
          x: new Date(d.date).toISOString().slice(0,10),
          y,
          rpe: d.rpe ?? 0,
          label: `${d.type} • ${d.actualPace} • RPE ${d.rpe ?? '-'}`,
        };
      })
      .filter(Boolean) as {x:string;y:number;rpe:number;label:string}[];
  }, [runDays]);

  const liftSeriesData = useMemo(() => liftSeries[exercise] || [], [liftSeries, exercise]);

  return (
    <Fade>
      <div className="grid gap-4">
        <Card title="Display Options">
          <div className="flex flex-wrap gap-4 items-center text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showPlanned} onChange={e=>setShowPlanned(e.target.checked)} />
              Planned
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={showActual} onChange={e=>setShowActual(e.target.checked)} />
              Actual
            </label>
            {loading && <span className="text-gray-500">Loading…</span>}
          </div>
        </Card>

        {/* RUN — Weekly mileage */}
        <Card title="Running — Weekly Mileage (Planned vs Actual)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runWeekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                {showPlanned && <Line type="monotone" dataKey="planned" stroke="var(--chart-stroke)" strokeWidth={2} dot={false} name="Planned" />}
                {showActual  && <Line type="monotone" dataKey="actual"  stroke="#06b6d4" strokeWidth={2} dot name="Actual" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* RUN — Pace scatter */}
        <Card title="Running — Actual Pace vs Date (color = RPE)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="category"                  // 👈 important
                  allowDuplicatedCategory={false}  // cleaner labels
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  tickFormatter={(t)=>secToMMSS(Number(t))}
                  domain={['dataMin - 15', 'dataMax + 15']}
                />
                <Tooltip
                  formatter={(v:any, name:any) => name === 'y' ? secToMMSS(Number(v)) : v}
                  labelFormatter={(lab) => lab}
                />
                <Legend />
                <Scatter
                  name="Actual Pace"
                  data={runScatter}
                  fill="#8b5cf6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* LIFT — Weekly volume */}
        <Card title="Lifting — Weekly Volume (Planned vs Actual)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liftWeekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                {showPlanned && <Line type="monotone" dataKey="planned" stroke="var(--chart-stroke)" strokeWidth={2} dot={false} name="Planned" />}
                {showActual  && <Line type="monotone" dataKey="actual"  stroke="#22c55e" strokeWidth={2} dot name="Actual" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* LIFT — Per exercise progress */}
        <Card title="Lifting — Per Exercise Progress">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <label className="text-sm">
              Exercise
              <select
                className="input ml-2"
                value={exercise}
                onChange={(e)=>setExercise(e.target.value)}
              >
                {Object.keys(liftSeries).map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liftSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {showPlanned && <Line type="monotone" dataKey="target" stroke="var(--chart-stroke)" strokeWidth={2} dot={false} name="Target" />}
                {showActual  && <Line type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} dot name="Actual" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </Fade>
  );
}
