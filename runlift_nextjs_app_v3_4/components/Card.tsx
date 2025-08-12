'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

type CardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function Card({
  title, subtitle, actions, children, className, contentClassName,
}: CardProps) {
  return (
    <section className={clsx('card', className)}>
      {(title || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {typeof title === 'string' ? <h3 className="text-lg font-semibold">{title}</h3> : title}
            {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={clsx('min-w-0', contentClassName)}>
        {children}
      </div>
    </section>
  );
}
