import { Trophy, Flag, ShieldCheck, Gauge, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/services/supabase/auth';

const baseLinks = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/submit', label: 'Submit Picks', icon: Flag },
  { to: '/picks', label: 'All Picks', icon: Trophy },
  { to: '/results', label: 'Results', icon: Trophy },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const links = profile?.role === 'admin' ? [...baseLinks, { to: '/admin', label: 'Admin', icon: ShieldCheck }] : baseLinks;

  return (
    <div className="grid-bg min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel mb-6 flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.4em] text-accent2">Fantasy F1 Picks</p>
            <h1 className="font-display text-3xl font-bold text-gradient">Private Grid Control</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Signed in</p>
              <p className="font-medium text-text">{profile?.displayName ?? profile?.email ?? 'Unknown'}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-muted transition hover:border-accent/40 hover:text-text"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <nav className="mb-6 flex gap-3 overflow-x-auto pb-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'relative flex min-w-max items-center gap-2 rounded-2xl border px-4 py-3 font-medium transition',
                  isActive
                    ? 'border-accent/50 bg-accent/15 text-text shadow-glow'
                    : 'border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {isActive ? (
                    <motion.span
                      layoutId="nav-highlight"
                      className="absolute inset-0 -z-10 rounded-2xl bg-accent/10"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
