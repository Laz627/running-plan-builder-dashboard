'use client';
import Fade from '@/components/Fade';
import Card from '@/components/Card';
import { useEffect, useState } from 'react';

interface PlanItem {
  id: string;
  day: string;
  run?: string;
  lift?: string;
  notes?: string;
}

export default function PlanPage() {
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/plan')
      .then((res) => res.json())
      .then((data) => {
        setPlan(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Fade>
        <p className="text-center text-gray-400 py-10">Loading weekly plan...</p>
      </Fade>
    );
  }

  return (
    <Fade>
      <div className="grid gap-4 md:grid-cols-2">
        {plan.map((item) => (
          <Card
            key={item.id}
            title={
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">{item.day}</span>
              </div>
            }
          >
            <div className="flex flex-col gap-2">
              {item.run && (
                <div className="p-3 rounded-lg bg-gray-800 text-gray-100 text-sm">
                  <span className="font-medium">Run: </span>
                  {item.run}
                </div>
              )}
              {item.lift && (
                <div className="p-3 rounded-lg bg-gray-800 text-gray-100 text-sm">
                  <span className="font-medium">Lift: </span>
                  {item.lift}
                </div>
              )}
              {item.notes && (
                <div className="p-3 rounded-lg bg-gray-700 text-gray-300 text-sm italic">
                  {item.notes}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Fade>
  );
}
