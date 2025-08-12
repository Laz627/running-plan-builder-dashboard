import { motion } from 'framer-motion';

'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import { toast } from '@/components/Toaster';
import Fade from '@/components/Fade';

export default function SettingsPage(){
  const [form, setForm] = useState<any>({
    start_incline:'35', start_shoulder:'35', start_dips:'60', start_rows:'90', start_pu:'60', start_lat:'75', start_legpress:'160', start_ham:'60', start_calf:'45',
    goal_mp:'9:40', tempo_base:'9:00', easy_base:'10:30', speed_base:'7:55', recovery_base:'10:35',
    temp:'80', humidity:'60', inc_upper:'5', inc_lower:'10', inc_assist:'5'
  });
  useEffect(() => { fetch('/api/settings').then(r=>r.json()).then(s => setForm((f:any)=>({...f, ...s}))); }, []);
  function save(){
    fetch('/api/settings',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form)})
      .then(()=> toast({ title: 'Settings saved', description: 'Your preferences are updated.' }));
  }
  function set(k:string, v:string){ setForm((f:any)=>({...f,[k]:v})) }
  return (
    <Fade>
      <div className="grid gap-4 md:grid-cols-2">
      <Card title="Pace & Weather">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">Goal MP<input className="input" value={form.goal_mp} onChange={e=>set('goal_mp', e.target.value)}/></label>
          <label className="text-sm">Tempo<input className="input" value={form.tempo_base} onChange={e=>set('tempo_base', e.target.value)}/></label>
          <label className="text-sm">Easy<input className="input" value={form.easy_base} onChange={e=>set('easy_base', e.target.value)}/></label>
          <label className="text-sm">Speed<input className="input" value={form.speed_base} onChange={e=>set('speed_base', e.target.value)}/></label>
          <label className="text-sm">Recovery<input className="input" value={form.recovery_base} onChange={e=>set('recovery_base', e.target.value)}/></label>
          <label className="text-sm">Temp °F<input className="input" value={form.temp} onChange={e=>set('temp', e.target.value)}/></label>
          <label className="text-sm">Humidity %<input className="input" value={form.humidity} onChange={e=>set('humidity', e.target.value)}/></label>
        </div>
      </Card>
      <Card title="Lifting Auto-Progression">
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm">Upper +lb<input className="input" value={form.inc_upper} onChange={e=>set('inc_upper', e.target.value)}/></label>
          <label className="text-sm">Lower +lb<input className="input" value={form.inc_lower} onChange={e=>set('inc_lower', e.target.value)}/></label>
          <label className="text-sm">Assist -lb<input className="input" value={form.inc_assist} onChange={e=>set('inc_assist', e.target.value)}/></label>
        </div>
      </Card>

      <Card title="Lifting Starting Weights (3×8 Machines)">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <label className="text-sm">Incline Chest Press (lb)
            <input className="input" value={form.start_incline ?? '35'} onChange={e=>set('start_incline', e.target.value)}/>
          </label>
          <label className="text-sm">Shoulder Press (lb)
            <input className="input" value={form.start_shoulder ?? '35'} onChange={e=>set('start_shoulder', e.target.value)}/>
          </label>
          <label className="text-sm">Assisted Dips (assist lb)
            <input className="input" value={form.start_dips ?? '60'} onChange={e=>set('start_dips', e.target.value)}/>
          </label>
          <label className="text-sm">Seated Rows (lb)
            <input className="input" value={form.start_rows ?? '90'} onChange={e=>set('start_rows', e.target.value)}/>
          </label>
          <label className="text-sm">Assisted Pull-ups (assist lb)
            <input className="input" value={form.start_pu ?? '60'} onChange={e=>set('start_pu', e.target.value)}/>
          </label>
          <label className="text-sm">Lat Pulldowns (lb)
            <input className="input" value={form.start_lat ?? '75'} onChange={e=>set('start_lat', e.target.value)}/>
          </label>
          <label className="text-sm">Leg Press (lb)
            <input className="input" value={form.start_legpress ?? '160'} onChange={e=>set('start_legpress', e.target.value)}/>
          </label>
          <label className="text-sm">Hamstring Curl (lb)
            <input className="input" value={form.start_ham ?? '60'} onChange={e=>set('start_ham', e.target.value)}/>
          </label>
          <label className="text-sm">Calf Raises (lb)
            <input className="input" value={form.start_calf ?? '45'} onChange={e=>set('start_calf', e.target.value)}/>
          </label>
        </div>
      </Card>
    
      <div className="md:col-span-2 flex justify-end">
        <button onClick={save} className="btn">Save</button>
      </div>
    </div>
  );
}
