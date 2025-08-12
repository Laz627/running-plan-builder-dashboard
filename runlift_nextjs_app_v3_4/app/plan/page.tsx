'use client';

import Fade from '@/components/Fade';
import Card from '@/components/Card';
import { useEffect, useState } from 'react';
import { toast } from '@/components/Toaster';

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function defaultPlan(): string[][] {
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
  const [plan, setPlan] = useState<string[][]>(defaultPlan());
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ 
    (async ()=>{
      try{
        const r = await fetch('/api/settings');
        const s = await r.json();
        if (s?.custom_plan_json) {
          try { setPlan(JSON.parse(s.custom_plan_json)); } catch {}
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setCell(w:number, d:number, val:string){
    setPlan(prev=>{
      const next = prev.map(r=>r.slice());
      next[w][d] = val;
      return next;
    });
  }

  async function save(){
    const ok = await fetch('/api/settings',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ custom_plan_json: JSON.stringify(plan) })
    }).then(r=>r.ok).catch(()=>false);
    if(ok) toast({ title:'Plan saved', description:'Your 12-week plan has been updated.' });
    else toast({ title:'Save failed', description:'Please try again.' });
  }

  return (
    <Fade>
      <div className="grid gap-4">
        {/* Mobile-friendly per-week cards */}
        <div className="md:hidden">
          {plan.map((week, w)=>(
            <Card key={w} title={`Week ${w+1}`}>
              <div className="space-y-3">
                {week.map((val, d)=>(
                  <div key={d} className="grid gap-1">
                    <div className="text-xs text-gray-500">{days[d]}</div>
                    <textarea
                      className="input !py-3 !text-base"
                      value={val}
                      onChange={e=>setCell(w,d,e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}
                <div className="flex justify-end">
                  <button className="btn" onClick={save} disabled={loading}>
                    Save Week
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop table editor */}
        <Card title="Editable 12-Week Plan" className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Week</th>
                  {days.map(d=><th key={d} className="p-2">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {plan.map((row, w)=> (
                  <tr key={w} className="border-t">
                    <td className="p-2 font-medium">Week {w+1}</td>
                    {row.map((cell, i)=> (
                      <td key={i} className="p-1 align-top">
                        <textarea
                          className="input"
                          value={cell}
                          onChange={e=>setCell(w,i,e.target.value)}
                          rows={2}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={save} className="btn" disabled={loading}>
              Save Plan
            </button>
          </div>
        </Card>
      </div>
    </Fade>
  );
}
