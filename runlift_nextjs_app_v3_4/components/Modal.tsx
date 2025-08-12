'use client';

import { useEffect } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g. 'max-w-xl' or 'max-w-2xl'
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-xl',
}: ModalProps) {
  // close on ESC
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div aria-modal="true" role="dialog"
         className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <button aria-label="Close modal"
              className="absolute inset-0 bg-black/50"
              onClick={onClose} />
      {/* panel */}
      <div className={`
          relative w-full sm:${maxWidthClass}
          bg-white dark:bg-[rgb(var(--card))]
          sm:rounded-2xl shadow-xl
          p-5 sm:p-6
          h-[92vh] sm:h-auto sm:max-h-[85vh]
          overflow-y-auto
          pt-[max(20px,env(safe-area-inset-top))]
          pb-[max(20px,env(safe-area-inset-bottom))]
        `}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
          <button onClick={onClose}
                  className="rounded-md px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
            ✕
          </button>
        </div>
        {/* content */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
