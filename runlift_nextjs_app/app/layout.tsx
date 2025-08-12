
import './globals.css';

export const metadata = { title: 'Run + Lift', description: 'Marathon + PPL Dashboard' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container py-6 space-y-6">
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200 mb-4">
            <div className="container py-3 flex items-center justify-between">
              <h1 className="text-xl font-semibold">🏃‍♂️ Run + 💪 Lift</h1>
              <nav className="flex gap-3 text-sm">
                <a className="pill" href="/today">Today</a>
                <a className="pill" href="/plan">Plan</a>
                <a className="pill" href="/charts">Charts</a>
                <a className="pill" href="/settings">Settings</a>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
