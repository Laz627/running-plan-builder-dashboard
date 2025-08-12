'use client';

import { useEffect } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** On mobile the modal becomes full-screen; on desktop it’s a centered card. */
  maxWidthClass?: string; // e.g. 'max-w-xl'
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-xl',
}: ModalProps) {
  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* panel */}
      <div
        className={`relative w-full sm:${maxWidthClass} bg-white dark:bg-[rgb(var(--card))] sm:rounded-2xl shadow-xl sm:m-4 p-4 sm:p-6 
        h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            aria-label="Close"
            className="rounded-md px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
