'use client';

import { useEffect, useRef } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidthClass?: string; // 'max-w-xl' | 'max-w-2xl' etc.
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-xl',
}: ModalProps) {
  const scrollYRef = useRef<number>(0);

  // Lock background scroll when open; restore on close
  useEffect(() => {
    if (!open) return;

    scrollYRef.current = window.scrollY || 0;
    const body = document.body;
    const html = document.documentElement;

    body.style.position = 'fixed';
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden'; // block bg scrolling (x & y)
    html.style.overscrollBehavior = 'none';

    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.overflow = '';
      html.style.overscrollBehavior = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel (mobile = bottom sheet; desktop = centered card) */}
      <div
        className={`
          relative w-full sm:${maxWidthClass}
          bg-white dark:bg-[rgb(var(--card))]
          sm:rounded-2xl shadow-xl
          pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]
          px-5 sm:px-6
          h-[92vh] sm:h-auto sm:max-h-[85vh]
          overflow-hidden
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content ONLY inside the modal */}
        <div
          className="
            space-y-4
            overflow-y-auto overflow-x-auto   /* allow horizontal scroll if needed */
            overscroll-contain
            min-w-0
            touch-pan-y                        /* ensure vertical touch scroll works */
          "
          style={{
            maxHeight: 'calc(92vh - 64px)',   // header height fudge on mobile
            WebkitOverflowScrolling: 'touch',  // iOS momentum scrolling
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
