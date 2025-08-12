import * as React from 'react';
import { cn } from '@/lib/utils';

export default function Card({title, children, className}:{title?:string; children: React.ReactNode; className?:string}){
  return (
    <section className={cn('card', className)}>
      {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
      {children}
    </section>
  );
}
