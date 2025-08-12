'use client';

import type { ReactNode } from 'react';
import clsx from 'clsx';

type CardProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;           // right-side header actions
  children: ReactNode;
  className?: string;
  contentClassName?: string;     // extra classes for inner content
  noXScroll?: boolean;           // set true to disable horizontal scroll wrapper
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
    <section className={clsx(
      'card',                      // uses your Tailwind @apply styles
      className
    )}>
      {(title || actions) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            {typeof title === 'string'
              ? <h3 className="text-lg font-semibold">{title}</h3>
              : title}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}

      {/* Content: wrap in horizontal scroll by default for ALL cards */}
      <div className={clsx(
        noXScroll ? undefined : 'scroll-x',
        'min-w-0',                  // prevents children from forcing page-wide overflow
        contentClassName
      )}>
        {children}
      </div>
    </section>
  );
}
