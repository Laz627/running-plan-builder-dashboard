
'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Card';
import { mmssToMin, minToMMSS, heatHumidityFactor, paceBands } from '@/lib/pacing';

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function defaultPlan(){ /* same as in plan */ return [
  ['ER 5 mi (Easy)','TR 5–6 mi (Tempo)','MR 6–7 mi (Easy)','SR 5 mi (8×400m)','ER 5 mi (Easy)','LR 8–10 mi (Easy)','Rest'],
  ['ER 5 mi (Easy)','TR 5–6 mi (Tempo)','MR 6–7 mi (Easy)','SR 5 mi (8×400m)','ER 5 mi (Easy)','LR 8–10 mi (Easy)','Rest'],
  ['ER 5 mi (Easy)','TR 5–6 mi (Tempo)','MR 6–7 mi (Easy)','SR 5 mi (8×400m)','ER 5 mi (Easy)','LR 9–11 mi (Easy)','Rest'],
  ['ER 5 mi (Easy)','TR 5–6 mi (Tempo)','MR 6–7 mi (Easy)','SR 5 mi (8×400m)','ER 5 mi (Easy)','LR 10 mi (Easy)','Rest'],
  ['ER 5 mi (Easy)','TR 7 mi (Tempo)','MR 8 mi (Last 2 @ MP)','SR 6 mi (6×800m)','ER 5 mi (Easy)','LR 12 mi (Last 3 @ MP)','Rest'],
  ['ER 5 mi (Easy)','TR 7 mi (Tempo)','MR 8 mi (Last 2 @ MP)','SR 6 mi (6×800m)','ER 5 mi (Easy)','LR 13 mi (Last 3 @ MP)','Rest'],
  ['ER 5 mi (Easy)','TR 7 mi (Tempo)','MR 8 mi (Last 2 @ MP)','SR 6 mi (6×800m)','ER 5 mi (Easy)','LR 14 mi (Last 3 @ MP)','Rest'],
  ['ER 5 mi (Easy)','TR 7 mi (Tempo)','MR 8 mi (Last 2 @ MP)','SR 6 mi (6×800m)','ER 5 mi (Easy)','LR 15 mi (Last 3 @ MP)','Rest'],
  ['ER 5 mi (Easy)','TR 8 mi (Tempo)','MR 9 mi (Last 3 @ MP)','SR 6 mi (10×400m)','ER 5 mi (Easy)','LR 18 mi (Last 4 @ MP)','Rest'],
  ['ER 5 mi (Easy)','TR 8 mi (Tempo)','MR 9 mi (Last 3 @ MP)','SR 6 mi (10×400m)','ER 5 mi (Easy)','LR 20 mi (Last 4 @ MP)','Rest'],
  ['ER 4 mi (Easy)','TR 5 mi (Tempo)','MR 6 mi (Easy)','SR 4 mi (6×400m)','ER 4 mi (Easy)','LR 10–12 mi (Easy)','Rest'],
  ['ER 4 mi (Easy)','TR 5 mi (Tempo)','MR 6 mi (Easy)','SR 4 mi (6×400m)','ER 4 mi (Easy)','LR 6 mi (Easy)','Rest'],
]; }

function fueling(desc:string){
  const m = desc.match(/\d+/);
  if(!m) return 'Rest day';
  const miles = parseInt(m[0]);
  if (miles < 5) return 'Pre: 12 oz water; no fuel needed';
  if (miles <= 8) return 'Pre: 12–16 oz water; 20g carbs pre; Hydrate if >70°F';
  if (miles <= 12) return 'Pre: 12–16 oz + electrolytes; 20–30g carbs pre; 3–5 oz water q20m; 20g carbs halfway';
  return 'Pre: 12–16 oz + electrolytes; 30–40g carbs pre; 3–5 oz water q15–20m; 20–30g carbs q30–40m';
}

export default function TodayPage(){
  const [settings, setSettings] = useState<any>({});
  const [plan, setPlan] = useState<string[][]>(defaultPlan());

  useEffect(()=>{ fetch('/api/settings').then(r=>r.json()).then(s=>{
    setSettings(s);
    if (s.custom_plan_json) try { setPlan(JSON.parse(s.custom_plan_json)); } catch {}
  }); }, []);

  const today = new Date();
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][today.getDay()];
  const start = settings.start_date ? new Date(settings.start_date) : new Date();
  const diff = Math.max(0, Math.floor((+today - +start)/(1000*60*60*24)));
  const week = Math.min(12, Math.floor(diff/7)+1);
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dayIdx = dayNames.indexOf(dow === 'Sun' ? 'Sun':'Mon') === -1 ? (today.getDay()+6)%7 : (today.getDay()+6)%7;
  const desc = plan[week-1]?.[dayIdx] ?? 'Rest';

  const kind = desc.toLowerCase().includes('tempo') ? 'Tempo' :
               desc.toLowerCase().includes('mp') ? 'MP' :
               desc.toLowerCase().includes('recovery') ? 'Recovery' :
               desc.toLowerCase().includes('easy') ? 'Easy' :
               (desc.includes('400')||desc.includes('800')) ? 'Speed' : '';

  const base = kind==='Tempo'? mmssToMin(settings.tempo_base||'9:00') :
               kind==='MP'? mmssToMin(settings.goal_mp||'9:40') :
               kind==='Recovery'? mmssToMin(settings.recovery_base||'10:35') :
               kind==='Easy'? mmssToMin(settings.easy_base||'10:30') :
               kind==='Speed'? mmssToMin(settings.speed_base||'7:55') : null;

  const factor = heatHumidityFactor(parseInt(settings.temp||'80'), parseInt(settings.humidity||'60'));

  const bands = base ? paceBands(base, kind) : null;
  const bandsHeat = bands ? bands.map(b=>b*factor) : null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Planned Run">
        <p className="text-sm text-gray-600 mb-2">Week {week} • {dayNames[dayIdx]}</p>
        <p className="font-medium">{desc}</p>
        {bands && bandsHeat && (
          <div className="mt-3 space-y-1">
            <div>Cool Bands: <span className="pill">{[...bands].map(b=>minToMMSS(b)).join(' · ')}</span></div>
            <div>Heat Bands: <span className="pill">{[...bandsHeat].map(b=>minToMMSS(b)).join(' · ')}</span></div>
          </div>
        )}
        <div className="mt-3 text-sm">Fueling: {fueling(desc)}</div>
      </Card>
      <Card title="Quick Log">
        <form onSubmit={async (e)=>{
          e.preventDefault();
          const form = new FormData(e.currentTarget as HTMLFormElement);
          await fetch('/api/logs/run',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
            logDate: new Date().toISOString(),
            runType: kind, plannedDesc: desc,
            targetPaceCool: bands?minToMMSS(bands[1]):'',
            targetPaceHeat: bandsHeat?minToMMSS(bandsHeat[1]):'',
            actualDistance: parseFloat(form.get('dist') as string || '0'),
            actualPace: form.get('pace'),
            rpe: parseInt(form.get('rpe') as string || '7'),
            notes: form.get('notes')
          })});
          alert('Saved run log');
        }} className="grid grid-cols-2 gap-3">
          <label className="text-sm">Distance (mi)<input name="dist" className="w-full border rounded px-2 py-1" placeholder="0.0"/></label>
          <label className="text-sm">Actual Pace (mm:ss)<input name="pace" className="w-full border rounded px-2 py-1" placeholder="10:00"/></label>
          <label className="text-sm col-span-2">RPE (1–10)<input name="rpe" className="w-full border rounded px-2 py-1" defaultValue="7"/></label>
          <label className="text-sm col-span-2">Notes<textarea name="notes" className="w-full border rounded px-2 py-1" rows={3}/></label>
          <div className="col-span-2 flex justify-end"><button className="px-4 py-2 rounded-xl bg-black text-white">Save</button></div>
        </form>
      </Card>
    </div>
  );
}
