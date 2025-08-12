'use client';

import Fade from '@/components/Fade';
import Card from '@/components/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/Tabs';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/Toaster';
import { LIFT_EXERCISES, RUN_TYPES } from '@/lib/exercises';

type RunLog = {
  id?: number;
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
  id?: number;
  logDate: string;
  dayType?: string | null;
  exercise?: string | null;
  weight?: number | null;
  sets?: number | null;
  reps?: number | null;
  rpe?: number | null;
  notes?: string | null;
};

function isoToday() {
  const d = new Date();
  return d.toISOString().slice(0,10);
}

export default function TodayPage() {
  // RUN form
  const [run, setRun] = useState<RunLog>({
    logDate: isoToday(),
    runType: 'Easy',
    actualDistance: 0,
    actualPace: '',
    rpe: 7,
    notes: ''
  });
  const [recentRuns, setRecentRuns] = useState<RunLog[]>([]);
  const [editingRunId, setEditingRunId] = useState<number | null>(null);

  // LIFT form
  const [lift, setLift] = useState<LiftLog>({
    logDate: isoToday(),
    dayType: 'Push',
    exercise: LIFT_EXERCISES[0],
    weight: 0,
    sets: 3,
    reps: 8,
    rpe: 7,
    notes: ''
  });
  const [recentLifts, setRecentLifts] = useState<LiftLog[]>([]);
  const [editingLiftId, setEditingLiftId] = useState<number | null>(null);

  async function loadRecent() {
    const r = await fetch('/api/logs/history?type=all&limit=20').then(r=>r.json());
    setRecentRuns(r.runs || []);
    setRecentLifts(r.lifts || []);
  }

  useEffect(()=>{ loadRecent(); }, []);

  // --------- RUN handlers ----------
  function setRunField<K extends keyof RunLog>(k: K, v: any) {
    setRun((f)=> ({ ...f, [k]: v }));
  }

  async function saveRun() {
    const method = editingRunId ? 'PUT' : 'POST';
    const url = editingRunId ? `/api/logs/run/${editingRunId}` : '/api/logs/run';
    const ok = await fetch(url, {
      method,
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(run)
    }).then(r=>r.ok).catch(()=>false);
    if (ok) {
      toast({ title: editingRunId ? 'Run updated' : 'Run saved', description: 'Entry stored successfully.' });
      setEditingRunId(null);
      setRun({ logDate: isoToday(), runType:'Easy', actualDistance:0, actualPace:'', rpe:7, notes:'' });
      loadRecent();
    } else {
      toast({ title:'Error', description:'Could not save run.' });
    }
  }

  function editRun(entry: RunLog) {
    setEditingRunId(entry.id!);
    setRun({
      logDate: entry.logDate?.slice(0,10) || isoToday(),
      runType: entry.runType || 'Easy',
      plannedDesc: entry.plannedDesc || '',
      targetPaceCool: entry.targetPaceCool || '',
      targetPaceHeat: entry.targetPaceHeat || '',
      actualDistance: entry.actualDistance ?? 0,
      actualPace: entry.actualPace || '',
      rpe: entry.rpe ?? 7,
      notes: entry.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteRun(id: number) {
    const ok = await fetch(`/api/logs/run/${id}`, { method:'DELETE' }).then(r=>r.ok).catch(()=>false);
    if (ok) {
      toast({ title:'Run deleted', description:'Entry removed.' });
      if (editingRunId === id) setEditingRunId(null);
      loadRecent();
    } else {
      toast({ title:'Error', description:'Could not delete run.' });
    }
  }

  // --------- LIFT handlers ----------
  function setLiftField<K extends keyof LiftLog>(k: K, v: any) {
    setLift((f)=> ({ ...f, [k]: v }));
  }

  async function saveLift() {
    const method = editingLiftId ? 'PUT' : 'POST';
    const url = editingLiftId ? `/api/logs/lift/${editingLiftId}` : '/api/logs/lift';
    const ok = await fetch(url, {
      method,
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(lift)
    }).then(r=>r.ok).catch(()=>false);
    if (ok) {
      toast({ title: editingLiftId ? 'Lift updated' : 'Lift saved', description: 'Entry stored successfully.' });
      setEditingLiftId(null);
      setLift({ logDate: isoToday(), dayType:'Push', exercise:LIFT_EXERCISES[0], weight:0, sets:3, reps:8, rpe:7, notes:'' });
      loadRecent();
    } else {
      toast({ title:'Error', description:'Could not save lift.' });
    }
  }

  function editLift(entry: LiftLog) {
    setEditingLiftId(entry.id!);
    setLift({
      logDate: entry.logDate?.slice(0,10) || isoToday(),
      dayType: entry.dayType || 'Push',
      exercise: entry.exercise || LIFT_EXERCISES[0],
      weight: entry.weight ?? 0,
      sets: entry.sets ?? 3,
      reps: entry.reps ?? 8,
      rpe: entry.rpe ?? 7,
      notes: entry.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteLift(id: number) {
    const ok = await fetch(`/api/logs/lift/${id}`, { method:'DELETE' }).then(r=>r.ok).catch(()=>false);
    if (ok) {
      toast({ title:'Lift deleted', description:'Entry removed.' });
      if (editingLiftId === id) setEditingLiftId(null);
      loadRecent();
    } else {
      toast({ title:'Error', description:'Could not delete lift.' });
    }
  }

  return (
    <Fade>
      <div className="grid gap-4">
        <Tabs defaultValue="run">
          <TabsList>
            <TabsTrigger value="run">Run</TabsTrigger>
            <TabsTrigger value="lift">Lift</TabsTrigger>
          </TabsList>

          {/* RUN TAB */}
          <TabsContent value="run">
            <Card title={editingRunId ? 'Edit Run' : 'Log Run'}>
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="text-sm">
                  Date
                  <input type="date" className="input" value={run.logDate} onChange={e=>setRunField('logDate', e.target.value)} />
                </label>
                <label className="text-sm">
                  Type
                  <select className="input" value={run.runType || 'Easy'} onChange={e=>setRunField('runType', e.target.value)}>
                    {RUN_TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  Distance (mi)
                  <input className="input" type="number" step="0.01" value={run.actualDistance ?? 0} onChange={e=>setRunField('actualDistance', parseFloat(e.target.value))}/>
                </label>
                <label className="text-sm">
                  Pace (mm:ss)
                  <input className="input" value={run.actualPace || ''} onChange={e=>setRunField('actualPace', e.target.value)}/>
                </label>
                <label className="text-sm">
                  RPE (1–10)
                  <input className="input" type="number" min={1} max={10} value={run.rpe ?? 7} onChange={e=>setRunField('rpe', parseInt(e.target.value || '7', 10))}/>
                </label>
                <label className="text-sm sm:col-span-3">
                  Notes
                  <textarea className="input" rows={2} value={run.notes || ''} onChange={e=>setRunField('notes', e.target.value)}/>
                </label>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                {editingRunId && (
                  <button className="btn" onClick={()=>{ setEditingRunId(null); setRun({ logDate: isoToday(), runType:'Easy', actualDistance:0, actualPace:'', rpe:7, notes:'' }); }}>
                    Cancel
                  </button>
                )}
                <button className="btn" onClick={saveRun}>{editingRunId ? 'Update' : 'Save'}</button>
              </div>
            </Card>

            <Card title="Recent Runs">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Date</th><th>Type</th><th>Mi</th><th>Pace</th><th>RPE</th><th>Notes</th><th></th></tr></thead>
                  <tbody>
                    {recentRuns.map(r=>(
                      <tr key={r.id} className="border-t">
                        <td className="p-2">{new Date(r.logDate).toISOString().slice(0,10)}</td>
                        <td className="p-2">{r.runType}</td>
                        <td className="p-2">{r.actualDistance ?? ''}</td>
                        <td className="p-2">{r.actualPace ?? ''}</td>
                        <td className="p-2">{r.rpe ?? ''}</td>
                        <td className="p-2">{r.notes ?? ''}</td>
                        <td className="p-2 whitespace-nowrap">
                          <button className="btn mr-2" onClick={()=>editRun(r as any)}>Edit</button>
                          <button className="btn" onClick={()=>deleteRun(r.id!)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {recentRuns.length === 0 && <tr><td colSpan={7} className="p-2 text-sm text-gray-500">No runs yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* LIFT TAB */}
          <TabsContent value="lift">
            <Card title={editingLiftId ? 'Edit Lift' : 'Log Lift'}>
              <div className="grid sm:grid-cols-3 gap-3">
                <label className="text-sm">
                  Date
                  <input type="date" className="input" value={lift.logDate} onChange={(e)=>setLiftField('logDate', e.target.value)} />
                </label>
                <label className="text-sm">
                  Day
                  <select className="input" value={lift.dayType || 'Push'} onChange={(e)=>setLiftField('dayType', e.target.value)}>
                    <option>Push</option><option>Pull</option><option>Legs</option>
                  </select>
                </label>
                <label className="text-sm">
                  Exercise
                  <select className="input" value={lift.exercise || LIFT_EXERCISES[0]} onChange={(e)=>setLiftField('exercise', e.target.value)}>
                    {LIFT_EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  Weight (lb) / Assist
                  <input type="number" className="input" value={lift.weight ?? 0} onChange={(e)=>setLiftField('weight', parseFloat(e.target.value || '0'))}/>
                </label>
                <label className="text-sm">
                  Sets
                  <input type="number" className="input" value={lift.sets ?? 3} onChange={(e)=>setLiftField('sets', parseInt(e.target.value || '3', 10))}/>
                </label>
                <label className="text-sm">
                  Reps
                  <input type="number" className="input" value={lift.reps ?? 8} onChange={(e)=>setLiftField('reps', parseInt(e.target.value || '8', 10))}/>
                </label>
                <label className="text-sm">
                  RPE (1–10)
                  <input type="number" className="input" min={1} max={10} value={lift.rpe ?? 7} onChange={(e)=>setLiftField('rpe', parseInt(e.target.value || '7', 10))}/>
                </label>
                <label className="text-sm sm:col-span-3">
                  Notes
                  <textarea className="input" rows={2} value={lift.notes || ''} onChange={(e)=>setLiftField('notes', e.target.value)}/>
                </label>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                {editingLiftId && (
                  <button className="btn" onClick={()=>{ setEditingLiftId(null); setLift({ logDate: isoToday(), dayType:'Push', exercise:LIFT_EXERCISES[0], weight:0, sets:3, reps:8, rpe:7, notes:'' }); }}>
                    Cancel
                  </button>
                )}
                <button className="btn" onClick={saveLift}>{editingLiftId ? 'Update' : 'Save'}</button>
              </div>
            </Card>

            <Card title="Recent Lifts">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Date</th><th>Day</th><th>Exercise</th><th>Weight</th><th>Sets×Reps</th><th>RPE</th><th>Notes</th><th></th></tr></thead>
                  <tbody>
                    {recentLifts.map(l=>(
                      <tr key={l.id} className="border-t">
                        <td className="p-2">{new Date(l.logDate).toISOString().slice(0,10)}</td>
                        <td className="p-2">{l.dayType}</td>
                        <td className="p-2">{l.exercise}</td>
                        <td className="p-2">{l.weight ?? ''}</td>
                        <td className="p-2">{(l.sets ?? 0)}×{(l.reps ?? 0)}</td>
                        <td className="p-2">{l.rpe ?? ''}</td>
                        <td className="p-2">{l.notes ?? ''}</td>
                        <td className="p-2 whitespace-nowrap">
                          <button className="btn mr-2" onClick={()=>editLift(l as any)}>Edit</button>
                          <button className="btn" onClick={()=>deleteLift(l.id!)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                    {recentLifts.length === 0 && <tr><td colSpan={8} className="p-2 text-sm text-gray-500">No lifts yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Fade>
  );
}
