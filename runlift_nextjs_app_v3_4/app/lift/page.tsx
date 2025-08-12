import { motion } from 'framer-motion';

'use client';
import Fade from '@/components/Fade';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Card';

type Ex = { name:string; start:number; region:'upper'|'lower'; assist?:boolean };

function getSettings(): Promise<any> {
  return fetch('/api/settings').then(r=>r.json());
}

function buildWeeks(exs: Ex[], incUpper:number, incLower:number, incAssist:number){
  const weeks = Array.from({length:12}, (_,i)=>i+1);
  const rows = exs.map(ex => {
    const weights:number[] = [];
    let cur = ex.start;
    weeks.forEach(()=>{
      weights.push(cur);
      // default progression assumes RPE <= 7; user can override via logs later
      if (ex.assist){
        cur = Math.max(0, cur - incAssist);
      } else {
        cur = cur + (ex.region === 'lower' ? incLower : incUpper);
      }
    });
    return { name: ex.name, weights };
  });
  return { weeks, rows };
}

export default function LiftPage(){
  const [s, setS] = useState<any>({});
  useEffect(()=>{ getSettings().then(setS); }, []);

  const incUpper = parseInt(s.inc_upper||'5'); 
  const incLower = parseInt(s.inc_lower||'10');
  const incAssist = parseInt(s.inc_assist||'5');

  const push: Ex[] = [
    { name:'Incline Chest Press (Machine)', start: parseFloat(s.start_incline||'35'), region:'upper' },
    { name:'Shoulder Press (Machine)', start: parseFloat(s.start_shoulder||'35'), region:'upper' },
    { name:'Assisted Chest Dips', start: parseFloat(s.start_dips||'60'), region:'upper', assist:true },
  ];
  const pull: Ex[] = [
    { name:'Seated Rows (Machine)', start: parseFloat(s.start_rows||'90'), region:'upper' },
    { name:'Assisted Pull-ups/Chin-ups', start: parseFloat(s.start_pu||'60'), region:'upper', assist:true },
    { name:'Lat Pulldowns (Machine)', start: parseFloat(s.start_lat||'75'), region:'upper' },
  ];
  const legs: Ex[] = [
    { name:'Leg Press (Machine)', start: parseFloat(s.start_legpress||'160'), region:'lower' },
    { name:'Hamstring Curl (Machine)', start: parseFloat(s.start_ham||'60'), region:'lower' },
    { name:'Calf Raises (Machine)', start: parseFloat(s.start_calf||'45'), region:'lower' },
    { name:'Ab Work (Minor)', start: 0, region:'lower' },
  ];

  const pushTable = buildWeeks(push, incUpper, incLower, incAssist);
  const pullTable = buildWeeks(pull, incUpper, incLower, incAssist);
  const legTable  = buildWeeks(legs, incUpper, incLower, incAssist);

  function Table({title, table}:{title:string; table:{weeks:number[], rows:{name:string; weights:number[]}[]}}){
    return (
      <Card title={title}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left">Exercise</th>
                {table.weeks.map(w => <th key={w} className="p-2 text-center">W{w}</th>)}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r,i)=>(
                <tr key={i} className="border-t">
                  <td className="p-2 font-medium">{r.name}</td>
                  {r.weights.map((w,idx)=>(<td key={idx} className="p-2 text-center">{w || '-'}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-600 mt-2">Progression rule: if RPE ≤ 7, +{incUpper} lb (upper) / +{incLower} lb (lower); for assisted moves, -{incAssist} lb assistance each week.</p>
      </Card>
    );
  }

  return (
    <Fade>
      <div className="grid gap-4">
      <Table title="Push Day (3×8)" table={pushTable} />
      <Table title="Pull Day (3×8)" table={pullTable} />
      <Table title="Leg Day (3×8)" table={legTable} />
    </div>
  );
}
