import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flag } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { signIn } from '@/services/supabase/auth';
import { getSupabaseClient } from '@/services/supabase/client';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(getSupabaseClient());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  if (session) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(values: LoginValues) {
    setError(null);
    try {
      await signIn(values.email, values.password);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to sign in.');
    }
  }

  return (
    <div className="grid-bg flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel grid w-full max-w-5xl overflow-hidden lg:grid-cols-[1.2fr,0.8fr]">
        <div className="hidden border-r border-white/10 bg-gradient-to-br from-accent/20 via-transparent to-accent2/10 p-10 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.5em] text-accent2">Private League</p>
              <h1 className="mt-4 max-w-lg font-display text-6xl font-bold leading-none text-gradient">Race picks. Lock. Reveal. Score.</h1>
            </div>
            <div className="space-y-4 text-sm leading-6 text-muted">
              <p>Built for a small private grid. Fast picks entry, strict lock timing, clean standings, and admin-controlled results.</p>
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-text">
                <Flag className="h-6 w-6 text-accent" />
                <span>Approved emails only. Shared league password. Server-side lock enforcement.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <p className="font-display text-xs uppercase tracking-[0.4em] text-accent2">Fantasy F1 Picks</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-text">Enter the paddock</h2>
          <p className="mt-3 text-sm leading-6 text-muted">Sign in with your approved email and the shared league password.</p>
          {!configured ? (
            <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-4 text-sm text-accent">
              Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`. Add them in `.env.local` to enable auth and data access.
            </div>
          ) : null}
          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="grid gap-2 text-sm text-muted">
              Email
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text outline-none transition focus:border-accent"
              />
              {errors.email ? <span className="text-accent">{errors.email.message}</span> : null}
            </label>
            <label className="grid gap-2 text-sm text-muted">
              Shared password
              <input
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text outline-none transition focus:border-accent"
              />
              {errors.password ? <span className="text-accent">{errors.password.message}</span> : null}
            </label>
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={!configured || isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
