import { supabase } from '../lib/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

/**
 * Register a new user with Supabase Auth.
 * Includes user metadata with full name.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string = 'Trader'
): Promise<AuthResponse> {
  const cleanEmail = email.trim();
  const cleanName = fullName.trim() || 'Trader';

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        name: cleanName,
      },
    },
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  };
}

/**
 * Sign in an existing user with Supabase Auth.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const cleanEmail = email.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    session: data.session,
    error: null,
  };
}

/**
 * Sign out the current user and clear local session state.
 */
export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('Sign out error:', error.message);
  }
}

/**
 * Retrieve the active Supabase authentication session.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data) return null;
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Retrieve the current authenticated Supabase user.
 */
export async function getUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Reset password via email.
 */
export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) {
    throw error;
  }
}

/**
 * Subscribe to Supabase authentication state changes.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}
