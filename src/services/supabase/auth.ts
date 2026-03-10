import type { Session } from '@supabase/supabase-js';
import { requireSupabaseClient } from '@/services/supabase/client';

export async function getSession(): Promise<Session | null> {
  const { data, error } = await requireSupabaseClient().auth.getSession();
  if (error) {
    throw error;
  }

  return data.session;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await requireSupabaseClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await requireSupabaseClient().auth.signOut();
  if (error) {
    throw error;
  }
}
