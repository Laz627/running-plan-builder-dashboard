'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle(){
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{ setMounted(true); }, []);
  if(!mounted) return null;
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <button
      className="rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm inline-flex items-center gap-2"
      onClick={()=> setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={16}/> : <Moon size={16}/>}
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
