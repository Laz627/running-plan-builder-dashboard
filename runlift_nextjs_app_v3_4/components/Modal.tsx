'use client';

import { useEffect, useRef } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** max width on desktop/tablet (Tailwind class) */
  maxWidthClass?: string; // e.g. 'max-w-xl' | 'max-w-2xl'
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-xl',
}: ModalProps) {
  const scrollYRef = useRef<number>(0);

  // Lock body scroll when open (no background scroll; works on mobile)
  useEffect(() => {
    if (!open) return;

    // Save scroll position and lock the body in place
    scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    const body = document.body;
    body.style.position = 'fixed';
    body.style.top = `-${scrollYRef.current}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden'; // hard lock, no horizontal either

    // Prevent pinch-bounce scroll chaining from modal to page on mobile
    const html = document.documentElement;
    html.style.overscrollBehavior = 'none';

    return () => {
      // Restore scroll + styles
      const y = scrollYRef.current;
      const body2 = document.body;
      const html2 = document.documentElement;
      body2.style.position = '';
      body2.style.top = '';
      body2.style.left = '';
      body2.style.right = '';
      body2.style.width = '';
      body2.style.overflow = '';
      html2.style.overscrollBehavior = '';
      window.scrollTo(0, y);
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

      {/* Panel (mobile = bottom sheet, desktop = centered card) */}
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
          className="space-y-4 overflow-y-auto overscroll-contain"
          style={{ maxHeight: 'calc(92vh - 64px)' }} /* mobile header height fudge */
        >
          {children}
        </div>
      </div>
    </div>
  );
}
