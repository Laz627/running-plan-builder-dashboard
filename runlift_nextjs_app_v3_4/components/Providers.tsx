'use client';

import { ThemeProvider } from 'next-themes';
import Toaster from '@/components/Toaster';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
