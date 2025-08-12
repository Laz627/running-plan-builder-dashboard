import './globals.css';
import Providers from '@/components/Providers';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export const metadata = {
  title: 'Run + Lift',
  description: 'Marathon + PPL Dashboard',
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} prefetch={false} className="navlink inline-flex items-center gap-2 px-3 py-2 rounded-md">
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <Providers>
          {/* FULL-BLEED HEADER */}
          <header className="sticky top-0 z-40 bg-white/92 dark:bg-[rgb(var(--card))]/92 backdrop-blur border-b border-gray-200 dark:border-gray-800">
            {/* Center the content but let background span the screen */}
            <div className="mx-auto w-full max-w-screen-xl
                            pl-[max(16px,env(safe-area-inset-left))]
                            pr-[max(16px,env(safe-area-inset-right))]
                            py-3 flex items-center justify-between">
              <h1 className="text-xl font-semibold">🏃‍♂️ Run + 💪 Lift</h1>
              <nav className="hidden sm:flex gap-2 text-sm">
                <NavLink href="/today">Today</NavLink>
                <NavLink href="/plan">Plan</NavLink>
                <NavLink href="/charts">Charts</NavLink>
                <NavLink href="/lift">Lift</NavLink>
                <NavLink href="/history">History</NavLink>
                <NavLink href="/settings">Settings</NavLink>
                <ThemeToggle />
              </nav>
              <div className="sm:hidden"><ThemeToggle /></div>
            </div>
          </header>

          {/* MAIN */}
          <main className="mx-auto w-full max-w-screen-xl
                           pl-[max(16px,env(safe-area-inset-left))]
                           pr-[max(16px,env(safe-area-inset-right))]
                           pt-4 pb-[calc(72px+env(safe-area-inset-bottom))]">
            {children}
          </main>

          {/* MOBILE BOTTOM NAV */}
          <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur">
            <div className="mx-auto w-full max-w-screen-xl
                            pl-[max(8px,env(safe-area-inset-left))]
                            pr-[max(8px,env(safe-area-inset-right))]">
              <div className="grid grid-cols-5">
                <Link href="/today" prefetch={false} className="flex items-center justify-center py-3 text-sm">Today</Link>
                <Link href="/plan" prefetch={false} className="flex items-center justify-center py-3 text-sm">Plan</Link>
                <Link href="/charts" prefetch={false} className="flex items-center justify-center py-3 text-sm">Charts</Link>
                <Link href="/lift" prefetch={false} className="flex items-center justify-center py-3 text-sm">Lift</Link>
                <Link href="/history" prefetch={false} className="flex items-center justify-center py-3 text-sm">History</Link>
              </div>
            </div>
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          </nav>
        </Providers>
      </body>
    </html>
  );
}
