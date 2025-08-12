'use client';
import * as React from 'react';
import * as RToast from '@radix-ui/react-toast';

type T = { title?: string; description?: string };

export function toast(t: T | string){
  if (typeof window === 'undefined') return;
  const detail = typeof t === 'string' ? { title: t } : t;
  window.dispatchEvent(new CustomEvent('app-toast', { detail }));
}

export default function Toaster(){
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState<T>({});
  React.useEffect(()=>{
    function onToast(e: any){
      setMessage(e.detail || {});
      setOpen(false);
      // allow close + reopen animation
      setTimeout(()=> setOpen(true), 10);
    }
    window.addEventListener('app-toast', onToast as any);
    return () => window.removeEventListener('app-toast', onToast as any);
  }, []);
  return (
    <RToast.Provider swipeDirection="right">
      <RToast.Root
        className="fixed bottom-20 right-4 z-[100] max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-card data-[state=open]:animate-in data-[state=closed]:animate-out"
        open={open}
        onOpenChange={setOpen}
      >
        {message.title && <RToast.Title className="font-medium">{message.title}</RToast.Title>}
        {message.description && <RToast.Description className="mt-1 text-sm text-gray-600 dark:text-gray-300">{message.description}</RToast.Description>}
        <RToast.Close className="absolute top-2 right-3 text-sm text-gray-500 hover:text-gray-900">✕</RToast.Close>
      </RToast.Root>
      <RToast.Viewport className="pointer-events-none" />
    </RToast.Provider>
  );
}
