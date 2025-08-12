'use client';

import Fade from '@/components/Fade';
import Card from '@/components/Card';
import { useEffect, useState } from 'react';
import EditRunModal, { RunLog } from '@/components/EditRunModal';
import EditLiftModal, { LiftLog } from '@/components/EditLiftModal';

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [lifts, setLifts] = useState<LiftLog[]>([]);
  const [loading, setLoading] = useState(true);

  // modal state
  const [runOpen, setRunOpen] = useState(false);
  const [liftOpen, setLiftOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunLog | null>(null);
  const [selectedLift, setSelectedLift] = useState<LiftLog | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/logs/history?type=all&limit=200');
      const data = await res.json();
      setRuns((data.runs || []).map((r: any) => ({ ...r })));
      setLifts((data.lifts || []).map((l: any) => ({ ...l })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openRun(r: RunLog) {
    setSelectedRun(r);
    setRunOpen(true);
  }
  function openLift(l: LiftLog) {
    setSelectedLift(l);
    setLiftOpen(true);
  }

  async function deleteRun(id: number) {
    const ok = await fetch(`/api/logs/run/${id}`, { method: 'DELETE' }).then(r=>r.ok).catch(()=>false);
    if (ok) load();
  }
  async function deleteLift(id: number) {
    const ok = await fetch(`/api/logs/lift/${id}`, { method: 'DELETE' }).then(r=>r.ok).catch(()=>false);
    if (ok) load();
  }

  return (
    <Fade>
      <div className="grid gap-4">
        <Card title="Runs">
          {loading ? (
            <div className="py-6 text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th><th>Type</th><th>Mi</th><th>Pace</th><th>RPE</th><th>Notes</th><th className="w-px"></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{new Date(r.logDate).toISOString().slice(0,10)}</td>
                      <td className="p-2">{r.runType}</td>
                      <td className="p-2">{r.actualDistance ?? ''}</td>
                      <td className="p-2">{r.actualPace ?? ''}</td>
                      <td className="p-2">{r.rpe ?? ''}</td>
                      <td className="p-2 max-w-[280px] truncate sm:whitespace-normal sm:max-w-none">{r.notes ?? ''}</td>
                      <td className="p-2 whitespace-nowrap">
                        <button className="btn mr-2" onClick={() => openRun(r)}>Edit</button>
                        <button className="btn" onClick={() => deleteRun(r.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {runs.length === 0 && (
                    <tr><td colSpan={7} className="p-2 text-sm text-gray-500">No runs logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Lifts">
          {loading ? (
            <div className="py-6 text-sm text-gray-500">Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th><th>Day</th><th>Exercise</th><th>Weight</th><th>Sets×Reps</th><th>RPE</th><th>Notes</th><th className="w-px"></th>
                  </tr>
                </thead>
                <tbody>
                  {lifts.map(l => (
                    <tr key={l.id} className="border-t">
                      <td className="p-2">{new Date(l.logDate).toISOString().slice(0,10)}</td>
                      <td className="p-2">{l.dayType}</td>
                      <td className="p-2">{l.exercise}</td>
                      <td className="p-2">{l.weight ?? ''}</td>
                      <td className="p-2">{(l.sets ?? 0)}×{(l.reps ?? 0)}</td>
                      <td className="p-2">{l.rpe ?? ''}</td>
                      <td className="p-2 max-w-[280px] truncate sm:whitespace-normal sm:max-w-none">{l.notes ?? ''}</td>
                      <td className="p-2 whitespace-nowrap">
                        <button className="btn mr-2" onClick={() => openLift(l)}>Edit</button>
                        <button className="btn" onClick={() => deleteLift(l.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {lifts.length === 0 && (
                    <tr><td colSpan={8} className="p-2 text-sm text-gray-500">No lifts logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <EditRunModal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        entry={selectedRun}
        onSaved={load}
        onDeleted={load}
      />
      <EditLiftModal
        open={liftOpen}
        onClose={() => setLiftOpen(false)}
        entry={selectedLift}
        onSaved={load}
        onDeleted={load}
      />
    </Fade>
  );
}
