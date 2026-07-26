import { Link, NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useCampusStore } from '../store/campusStore';

const nav = [
  { to: '/', label: 'Overview', roles: ['Student', 'Faculty', 'Admin', 'Security'] },
  { to: '/student', label: 'Student', roles: ['Student', 'Admin'] },
  { to: '/faculty', label: 'Faculty', roles: ['Faculty', 'Admin'] },
  { to: '/admin', label: 'Admin', roles: ['Admin'] },
  { to: '/emergency', label: 'Emergency', roles: ['Security', 'Admin'] },
];

export function AppShell() {
  const { name, role, signOut } = useAuthStore();
  const apiStatus = useCampusStore((state) => state.apiStatus);
  const apiError = useCampusStore((state) => state.apiError);

  return (
    <div className="min-h-screen bg-mesh-gradient text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 p-4 lg:p-6">
        <aside className="hidden w-72 shrink-0 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl lg:flex lg:flex-col">
          <Link to="/" className="mb-8">
            <div className="text-xs uppercase tracking-[0.4em] text-cyan-200/80">Campus Digital Twin</div>
            <div className="mt-2 text-2xl font-semibold">Live campus intelligence</div>
          </Link>

          <div className="mb-6 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <div className="text-xs uppercase tracking-[0.35em] text-slate-400">Signed in as</div>
            <div className="mt-2 text-lg font-semibold">{name}</div>
            <div className="text-sm text-cyan-300">{role}</div>
          </div>

          <nav className="space-y-2">
            {nav.filter((item) => item.roles.includes(role)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'block rounded-2xl px-4 py-3 text-sm transition',
                    isActive ? 'bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/30' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={signOut}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              Sign out
            </button>
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              Real-time sync through JWT, SignalR, PostgreSQL, and Azure-ready services.
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/60 shadow-glow backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            {apiStatus === 'offline' && (
              <div className="border-b border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 sm:px-6">
                <div className="font-semibold">Offline mode</div>
                <div className="mt-1 text-amber-50/80">
                  {apiError ?? 'The live API is unavailable. The dashboard is showing local data until the connection returns.'}
                </div>
              </div>
            )}
            <div className="border-b border-white/10 px-4 py-4 sm:px-6 lg:hidden">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Campus Digital Twin</div>
                  <div className="text-xl font-semibold">Live campus intelligence</div>
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
                >
                  Sign out
                </button>
              </div>
            </div>

            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
