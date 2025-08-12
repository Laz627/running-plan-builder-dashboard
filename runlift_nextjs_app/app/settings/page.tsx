
'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';

export default function SettingsPage(){
  const [form, setForm] = useState<any>({
    goal_mp:'9:40', tempo_base:'9:00', easy_base:'10:30', speed_base:'7:55', recovery_base:'10:35',
    temp:'80', humidity:'60', inc_upper:'5', inc_lower:'10', inc_assist:'5'
  });
  useEffect(() => { fetch('/api/settings').then(r=>r.json()).then(s => setForm((f:any)=>({...f, ...s}))); }, []);
  function save(){
    fetch('/api/settings',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)})
      .then(()=>alert('Saved settings'));
  }
  function set(k:string, v:string){ setForm((f:any)=>({...f,[k]:v})) }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Pace & Weather">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Goal MP<input className="w-full border rounded px-2 py-1" value={form.goal_mp} onChange={e=>set('goal_mp', e.target.value)}/></label>
          <label className="text-sm">Tempo<input className="w-full border rounded px-2 py-1" value={form.tempo_base} onChange={e=>set('tempo_base', e.target.value)}/></label>
          <label className="text-sm">Easy<input className="w-full border rounded px-2 py-1" value={form.easy_base} onChange={e=>set('easy_base', e.target.value)}/></label>
          <label className="text-sm">Speed<input className="w-full border rounded px-2 py-1" value={form.speed_base} onChange={e=>set('speed_base', e.target.value)}/></label>
          <label className="text-sm">Recovery<input className="w-full border rounded px-2 py-1" value={form.recovery_base} onChange={e=>set('recovery_base', e.target.value)}/></label>
          <label className="text-sm">Temp °F<input className="w-full border rounded px-2 py-1" value={form.temp} onChange={e=>set('temp', e.target.value)}/></label>
          <label className="text-sm">Humidity %<input className="w-full border rounded px-2 py-1" value={form.humidity} onChange={e=>set('humidity', e.target.value)}/></label>
        </div>
      </Card>
      <Card title="Lifting Auto-Progression">
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm">Upper +lb<input className="w-full border rounded px-2 py-1" value={form.inc_upper} onChange={e=>set('inc_upper', e.target.value)}/></label>
          <label className="text-sm">Lower +lb<input className="w-full border rounded px-2 py-1" value={form.inc_lower} onChange={e=>set('inc_lower', e.target.value)}/></label>
          <label className="text-sm">Assist -lb<input className="w-full border rounded px-2 py-1" value={form.inc_assist} onChange={e=>set('inc_assist', e.target.value)}/></label>
        </div>
      </Card>
      <div className="md:col-span-2 flex justify-end">
        <button onClick={save} className="px-4 py-2 rounded-xl bg-black text-white">Save</button>
      </div>
    </div>
  );
}
