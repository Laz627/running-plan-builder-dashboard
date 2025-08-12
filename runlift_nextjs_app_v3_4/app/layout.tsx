import './globals.css';
import Providers from '@/components/Providers';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'Run + Lift',
  description: 'Marathon + PPL Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <Providers>
          <div className="container py-6 space-y-6">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[rgb(var(--card))]/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 mb-4">
              <div className="container py-3 flex items-center justify-between">
                <h1 className="text-xl font-semibold">🏃‍♂️ Run + 💪 Lift</h1>
                <nav className="hidden sm:flex gap-3 text-sm">
                  <a className="navlink" href="/today">Today</a>
                  <a className="navlink" href="/plan">Plan</a>
                  <a className="navlink" href="/charts">Charts</a>
                  <a className="navlink" href="/lift">Lift</a>
                  <a className="navlink" href="/settings">Settings</a>
                  <ThemeToggle />
                </nav>
                <div className="sm:hidden"><ThemeToggle /></div>
              </div>
            </header>

            {children}
          </div>

          {/* Mobile bottom nav */}
          <nav className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[rgb(var(--card))]/90 backdrop-blur">
            <div className="container grid grid-cols-4 text-sm">
              <a className="navlink justify-center" href="/today">Today</a>
              <a className="navlink justify-center" href="/plan">Plan</a>
              <a className="navlink justify-center" href="/charts">Charts</a>
              <a className="navlink justify-center" href="/lift">Lift</a>
            </div>
          </nav>
        </Providers>
      </body>
    </html>
  );
}
