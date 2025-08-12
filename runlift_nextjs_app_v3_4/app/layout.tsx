import './globals.css';
import Providers from '@/components/Providers';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Run + Lift',
  description: 'Marathon + PPL Dashboard',
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  // (Optional) lightweight "active" state
  // On Next 14 app router, you can read the path via headers if needed.
  const h = headers();
  const pathname = h.get('x-pathname') || '';
  const active = pathname === href;
  return (
    <Link
      href={href}
      prefetch={false}
      className={`navlink inline-flex items-center gap-2 px-3 py-2 rounded-md ${
        active ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <Providers>
          {/* Sticky header */}
          <header className="sticky top-0 z-40 bg-white/90 dark:bg-[rgb(var(--card))]/90 backdrop-blur border-b border-gray-200 dark:border-gray-800">
            <div className="container py-3 flex items-center justify-between">
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

          {/* Main content with bottom padding so it doesn't hide behind the bottom nav */}
          <main className="container py-4 pb-24">{children}</main>

          {/* Mobile bottom nav — each link is its own grid cell and cannot overlap */}
          <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[rgb(var(--card))]/95 backdrop-blur">
            <div className="grid grid-cols-5">
              <Link href="/today" prefetch={false} className="flex items-center justify-center py-3 text-sm">
                Today
              </Link>
              <Link href="/plan" prefetch={false} className="flex items-center justify-center py-3 text-sm">
                Plan
              </Link>
              <Link href="/charts" prefetch={false} className="flex items-center justify-center py-3 text-sm">
                Charts
              </Link>
              <Link href="/lift" prefetch={false} className="flex items-center justify-center py-3 text-sm">
                Lift
              </Link>
              <Link href="/history" prefetch={false} className="flex items-center justify-center py-3 text-sm">
                History
              </Link>
            </div>
          </nav>
        </Providers>
      </body>
    </html>
  );
}
