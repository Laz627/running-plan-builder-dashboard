'use client';

import Modal from '@/components/Modal';
import { RUN_TYPES } from '@/lib/exercises';
import { useState } from 'react';
import { toast } from '@/components/Toaster';

export type RunLog = {
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

function isoDate(s?: string) {
  if (!s) return '';
  return new Date(s).toISOString().slice(0, 10);
}

export default function EditRunModal({
  open,
  onClose,
  entry,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  entry: RunLog | null;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<RunLog | null>(entry);

  // resync when the selected entry changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (open && entry && form?.id !== entry.id) setForm(entry);

  function set<K extends keyof RunLog>(k: K, v: any) {
    if (!form) return;
    setForm({ ...form, [k]: v });
  }

  async function save() {
    if (!form) return;
    const ok = await fetch(`/api/logs/run/${form.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.ok).catch(() => false);
    if (ok) {
      toast({ title: 'Run updated', description: 'Changes saved.' });
      onSaved();
      onClose();
    } else {
      toast({ title: 'Error', description: 'Could not save changes.' });
    }
  }

  async function remove() {
    if (!form) return;
    const ok = await fetch(`/api/logs/run/${form.id}`, { method: 'DELETE' })
      .then(r => r.ok).catch(() => false);
    if (ok) {
      toast({ title: 'Run deleted', description: 'Entry removed.' });
      onDeleted();
      onClose();
    } else {
      toast({ title: 'Error', description: 'Could not delete run.' });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Run" maxWidthClass="max-w-2xl">
      {!form ? (
        <div className="text-sm text-gray-500">No entry selected.</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              Date
              <input type="date" className="input"
                value={isoDate(form.logDate)}
                onChange={e => set('logDate', e.target.value)} />
            </label>
            <label className="text-sm">
              Type
              <select className="input"
                value={form.runType || 'Easy'}
                onChange={e => set('runType', e.target.value)}>
                {RUN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="text-sm">
              Distance (mi)
              <input className="input" type="number" step="0.01"
                value={form.actualDistance ?? 0}
                onChange={e => set('actualDistance', parseFloat(e.target.value || '0'))}/>
            </label>
            <label className="text-sm">
              Pace (mm:ss)
              <input className="input" value={form.actualPace || ''}
                onChange={e => set('actualPace', e.target.value)} />
            </label>
            <label className="text-sm">
              RPE (1–10)
              <input className="input" type="number" min={1} max={10}
                value={form.rpe ?? 7}
                onChange={e => set('rpe', parseInt(e.target.value || '7', 10))}/>
            </label>
            <label className="text-sm sm:col-span-3">
              Notes
              <textarea className="input" rows={3}
                value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </label>
          </div>

          <div className="mt-4 flex gap-2 justify-between">
            <button className="btn" onClick={remove}>Delete</button>
            <div className="flex gap-2">
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn" onClick={save}>Save</button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
