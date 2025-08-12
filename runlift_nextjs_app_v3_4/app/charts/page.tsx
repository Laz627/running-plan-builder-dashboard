'use client';
import Fade from '@/components/Fade';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function defaultPlan(){ return [
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

function miles(desc: string){
  const nums = desc.replace('–','-').match(/\d+/g);
  if(!nums) return 0;
  if (desc.includes('–') || desc.includes('-')){
    const parts = desc.split(/–|-/);
    const vals = parts.map(p => parseFloat(p.match(/\d+/)?.[0]||'0')).filter(Boolean);
    if (vals.length>=2) return (vals[0]+vals[1])/2;
  }
  return parseFloat(nums[0]);
}

export default function ChartsPage(){
  const [plan, setPlan] = useState<string[][]>(defaultPlan());
  useEffect(()=>{ fetch('/api/settings').then(r=>r.json()).then(s=>{
    if (s.custom_plan_json) try { setPlan(JSON.parse(s.custom_plan_json)); } catch {}
  }); }, []);
  const weekly = plan.map(week => week.reduce((acc, d)=> acc + (d.includes('Rest')?0:miles(d)), 0));
  const data = weekly.map((m,i)=>({week: i+1, mileage: m}));
  return (
    <Fade>
      <Card title="Planned Weekly Mileage">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="mileage" stroke="var(--chart-stroke)" strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Fade>  
  </Card>
  );
}
