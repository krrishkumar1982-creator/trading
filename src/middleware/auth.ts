import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  devUserId?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const headerUserId = req.headers['x-user-id'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
        req.devUserId = decodedToken.uid;
        return next();
      } catch (error: any) {
        console.warn('Firebase ID token verification failed:', error?.message || error);
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or expired authentication token',
        });
      }
    }
  }

  // Guest / unauthenticated fallback:
  // Only allow client-provided guest IDs that start with 'guest_' to isolate temporary sessions.
  // Never allow unauthenticated clients to claim non-guest IDs or real Firebase UIDs without a verified token.
  if (headerUserId && headerUserId.startsWith('guest_')) {
    req.devUserId = headerUserId;
  } else {
    req.devUserId = 'guest_demo_session';
  }
  return next();
};
