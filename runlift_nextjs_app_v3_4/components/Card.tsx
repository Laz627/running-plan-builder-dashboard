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
  noXScroll?: boolean; // set true to disable horizontal scroll for this card
};

export default function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  contentClassName,
  noXScroll = false,
}: CardProps) {
  return (
    <section className={clsx('card', className)}>
      {(title || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {typeof title === 'string'
              ? <h3 className="text-lg font-semibold">{title}</h3>
              : title}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}

      {/* Scroll container for ALL cards */}
      <div
        className={clsx(
          noXScroll ? undefined : 'scroll-x', // gives horizontal scrolling
          'min-w-0',                          // prevent parent overflow
          contentClassName
        )}
      >
        {/* Make inner content size to its own width so it can overflow */}
        <div className={noXScroll ? undefined : 'inline-block min-w-max'}>
          {children}
        </div>
      </div>
    </section>
  );
}
