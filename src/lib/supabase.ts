import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Retrieve environment variables for Supabase (Vite client environment)
const getEnv = (key: string): string => {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      return (import.meta as any).env[key] || '';
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
  } catch {}
  return '';
};

export const supabaseUrl =
  getEnv('VITE_SUPABASE_URL') ||
  getEnv('SUPABASE_URL') ||
  '';

export const supabaseAnonKey =
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  getEnv('SUPABASE_ANON_KEY') ||
  '';

/**
 * Checks whether valid Supabase client credentials are provided in the environment.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

// Generate a valid mock JWT payload for fallback local sessions if remote keys are not set
function createLocalJwt(userId: string, email: string, fullName: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const payload = btoa(
    JSON.stringify({
      aud: 'authenticated',
      exp,
      sub: userId,
      email,
      role: 'authenticated',
      user_metadata: {
        full_name: fullName,
        name: fullName,
      },
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
    })
  );
  const signature = btoa('local_signature_hash');
  return `${header}.${payload}.${signature}`;
}

const LOCAL_STORAGE_USERS_KEY = 'duskflow_local_auth_users_v1';
const LOCAL_STORAGE_SESSION_KEY = 'duskflow_local_auth_session_v1';

// Internal memory / storage state for fallback auth
const authListeners: Set<(event: AuthChangeEvent, session: Session | null) => void> = new Set();

function getLocalUsers(): Record<string, { id: string; email: string; passwordHash: string; fullName: string }> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalUsers(users: Record<string, { id: string; email: string; passwordHash: string; fullName: string }>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {}
}

function getLocalSession(): Session | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocalSession(session: Session | null) {
  try {
    if (session) {
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }
  } catch {}
}

function buildSession(user: { id: string; email: string; fullName: string }): Session {
  const token = createLocalJwt(user.id, user.email, user.fullName);
  const supabaseUser: User = {
    id: user.id,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: user.fullName, name: user.fullName },
    aud: 'authenticated',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    email: user.email,
    phone: '',
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  };

  return {
    access_token: token,
    token_type: 'bearer',
    expires_in: 3600 * 24 * 30,
    refresh_token: `rf_${user.id}_${Date.now()}`,
    user: supabaseUser,
  };
}

/**
 * Standard client instance when remote Supabase credentials exist.
 */
const realClient: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
      },
    });

/**
 * Enhanced Supabase client that seamlessly supports real Supabase Auth
 * while providing a compliant local fallback when credentials are placeholder.
 */
export const supabase = new Proxy(realClient, {
  get(target, prop) {
    if (prop === 'auth') {
      const realAuth = target.auth;
      if (isSupabaseConfigured()) {
        return realAuth;
      }

      // Fallback auth handler when remote Supabase credentials are not yet supplied
      return {
        ...realAuth,
        async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string; name?: string } } }) {
          const cleanEmail = email.trim().toLowerCase();
          const fullName = options?.data?.full_name || options?.data?.name || 'Trader';
          const localUsers = getLocalUsers();

          if (localUsers[cleanEmail]) {
            return {
              data: { user: null, session: null },
              error: { message: 'User already registered with this email', status: 400 },
            };
          }

          // Create permanent UUID for new user
          const userId = `usr_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
          localUsers[cleanEmail] = {
            id: userId,
            email: cleanEmail,
            passwordHash: password, // local fallback
            fullName,
          };
          saveLocalUsers(localUsers);

          const session = buildSession({ id: userId, email: cleanEmail, fullName });
          saveLocalSession(session);

          authListeners.forEach((fn) => {
            try {
              fn('SIGNED_IN', session);
            } catch (e) {
              console.error(e);
            }
          });

          return {
            data: { user: session.user, session },
            error: null,
          };
        },

        async signInWithPassword({ email, password }: { email: string; password: string }) {
          const cleanEmail = email.trim().toLowerCase();
          const localUsers = getLocalUsers();
          const existing = localUsers[cleanEmail];

          if (!existing) {
            // For convenience on new unseeded preview accounts or demo logins
            const userId = `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_').substring(0, 16)}_${Math.random().toString(36).substring(2, 6)}`;
            const fullName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Trader';
            localUsers[cleanEmail] = {
              id: userId,
              email: cleanEmail,
              passwordHash: password,
              fullName,
            };
            saveLocalUsers(localUsers);
            const session = buildSession(localUsers[cleanEmail]);
            saveLocalSession(session);

            authListeners.forEach((fn) => {
              try {
                fn('SIGNED_IN', session);
              } catch (e) {
                console.error(e);
              }
            });

            return {
              data: { user: session.user, session },
              error: null,
            };
          }

          if (existing.passwordHash !== password) {
            return {
              data: { user: null, session: null },
              error: { message: 'Invalid email or password', status: 400 },
            };
          }

          const session = buildSession(existing);
          saveLocalSession(session);

          authListeners.forEach((fn) => {
            try {
              fn('SIGNED_IN', session);
            } catch (e) {
              console.error(e);
            }
          });

          return {
            data: { user: session.user, session },
            error: null,
          };
        },

        async signOut() {
          saveLocalSession(null);
          authListeners.forEach((fn) => {
            try {
              fn('SIGNED_OUT', null);
            } catch (e) {
              console.error(e);
            }
          });
          return { error: null };
        },

        async getSession() {
          const session = getLocalSession();
          return { data: { session }, error: null };
        },

        async getUser() {
          const session = getLocalSession();
          return { data: { user: session?.user || null }, error: null };
        },

        onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
          authListeners.add(callback);
          const current = getLocalSession();
          // Initial trigger
          setTimeout(() => {
            callback(current ? 'INITIAL_SESSION' : 'SIGNED_OUT', current);
          }, 0);

          return {
            data: {
              subscription: {
                unsubscribe() {
                  authListeners.delete(callback);
                },
              },
            },
          };
        },

        async resetPasswordForEmail(email: string) {
          console.log(`[Supabase Auth] Password reset requested for: ${email}`);
          return { data: {}, error: null };
        },
      };
    }
    return (target as any)[prop];
  },
});

/**
 * Default storage buckets for DuskFlow / Pipzy trading journal assets.
 */
export const STORAGE_BUCKETS = {
  TRADE_ATTACHMENTS: 'trade-attachments',
  SCREENSHOTS: 'screenshots',
  AVATARS: 'avatars',
  JOURNAL_ASSETS: 'journal-assets',
} as const;

/**
 * Upload an image or file asset to Supabase Storage and obtain its public CDN URL.
 */
export async function uploadToSupabaseStorage(
  file: File | Blob | string,
  bucket: string = STORAGE_BUCKETS.SCREENSHOTS,
  customPath?: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    if (typeof file === 'string') {
      return file;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file as Blob);
    });
  }

  try {
    let fileBody: File | Blob;
    let contentType = 'image/png';
    let fileExtension = 'png';

    if (typeof file === 'string') {
      if (file.startsWith('data:')) {
        const matches = file.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentType = matches[1];
          fileExtension = contentType.split('/')[1] || 'png';
          const byteCharacters = atob(matches[2]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          fileBody = new Blob([byteArray], { type: contentType });
        } else {
          return file;
        }
      } else {
        return file;
      }
    } else {
      fileBody = file;
      contentType = file.type || 'image/png';
      fileExtension = file.type?.split('/')[1] || (file as File).name?.split('.').pop() || 'png';
    }

    const fileName = customPath || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const filePath = fileName.startsWith('/') ? fileName.substring(1) : fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBody, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Supabase Storage] Upload error:', uploadError.message);
      if (typeof file === 'string') return file;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(fileBody);
      });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data?.publicUrl || filePath;
  } catch (err: any) {
    console.error('[Supabase Storage] Unexpected error during upload:', err);
    if (typeof file === 'string') return file;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file as Blob);
    });
  }
}
