import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { adminAuth } from '../lib/firebase-admin.ts';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseServerClient = (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    role?: string;
    [key: string]: any;
  };
  devUserId?: string;
}

function parseJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const headerUserId = req.headers['x-user-id'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token && token !== 'null' && token !== 'undefined') {
      // 1. Try Supabase JWT token verification
      try {
        const payload = parseJwt(token);
        if (payload && (payload.sub || payload.user_id || payload.uid)) {
          const userId = payload.sub || payload.user_id || payload.uid;
          const email = payload.email || '';
          const name =
            payload.user_metadata?.full_name ||
            payload.user_metadata?.name ||
            payload.name ||
            email.split('@')[0] ||
            'Trader';

          // Check token expiration if present
          if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return res.status(401).json({
              success: false,
              error: 'Unauthorized: Session expired, please sign in again',
            });
          }

          // If remote Supabase client is available, verify with auth.getUser
          if (supabaseServerClient && !payload.local_fallback) {
            try {
              const { data, error } = await supabaseServerClient.auth.getUser(token);
              if (!error && data?.user) {
                req.user = {
                  uid: data.user.id,
                  email: data.user.email,
                  name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || name,
                  role: data.user.role || 'authenticated',
                };
                req.devUserId = data.user.id;
                return next();
              }
            } catch (err) {
              console.warn('[Supabase Auth Server] Remote verification warning:', err);
            }
          }

          // Valid Supabase JWT payload
          req.user = {
            uid: userId,
            email,
            name,
            role: payload.role || 'authenticated',
          };
          req.devUserId = userId;
          return next();
        }
      } catch (e) {
        console.warn('[Auth Middleware] JWT decode error:', e);
      }

      // 2. Try Firebase ID token verification as fallback
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email?.split('@')[0] || 'Trader',
        };
        req.devUserId = decodedToken.uid;
        return next();
      } catch (firebaseErr: any) {
        console.warn('[Auth Middleware] Token verification failed:', firebaseErr?.message || firebaseErr);
      }
    }
  }

  // 3. Guest / unauthenticated fallback:
  if (headerUserId && headerUserId.startsWith('guest_')) {
    req.devUserId = headerUserId;
  } else {
    req.devUserId = 'guest_demo_session';
  }
  return next();
};
