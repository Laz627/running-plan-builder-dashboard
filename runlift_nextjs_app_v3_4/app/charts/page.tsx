'use client';

import Fade from '@/components/Fade';
import Card from '@/components/Card';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

type WeeklyRow = { week: number; planned: number; actual: number };

export default function ChartsPage() {
  const [runWeekly, setRunWeekly] = useState<WeeklyRow[]>([]);
  const [liftWeekly, setLiftWeekly] = useState<WeeklyRow[]>([]);
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
        setLiftWeekly(l.weekly || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Fade>
      <div className="grid gap-4">
        <Card title="Display Options">
          <div className="flex gap-4 items-center text-sm">
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
      </div>
    </Fade>
  );
}
