
'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/Card';

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function defaultPlan(){
  return [
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
  ];
}

export default function PlanPage(){
  const [settings, setSettings] = useState<any>({});
  const [plan, setPlan] = useState<string[][]>(defaultPlan());

  useEffect(()=>{ fetch('/api/settings').then(r=>r.json()).then(s=>{
    setSettings(s);
    if (s.custom_plan_json) try { setPlan(JSON.parse(s.custom_plan_json)); } catch {}
  }); }, []);

  function save(){
    fetch('/api/settings',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({custom_plan_json: JSON.stringify(plan)})})
      .then(()=>alert('Saved plan'));
  }

  return (
    <Card title="Editable 12-Week Plan">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr><th className="p-2 text-left">Week</th>{days.map(d=><th key={d} className="p-2">{d}</th>)}</tr>
          </thead>
          <tbody>
            {plan.map((row, w)=> (
              <tr key={w} className="border-t">
                <td className="p-2 font-medium">Week {w+1}</td>
                {row.map((cell, i)=> (
                  <td key={i} className="p-1">
                    <textarea
                      className="w-full min-w-[160px] border rounded-xl px-2 py-1"
                      value={cell}
                      onChange={e=>{
                        const next = plan.map(r=>r.slice());
                        next[w][i] = e.target.value;
                        setPlan(next);
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-3">
        <button onClick={save} className="px-4 py-2 rounded-xl bg-black text-white">Save Plan</button>
      </div>
    </Card>
  );
}
