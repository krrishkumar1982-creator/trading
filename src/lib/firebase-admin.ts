import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let adminApp: App | null = null;
let _adminAuth: Auth | null = null;

export function getAdminAuth(): Auth | null {
  try {
    if (!_adminAuth) {
      if (!getApps().length) {
        adminApp = initializeApp({
          projectId: firebaseConfig.projectId,
        });
      } else {
        adminApp = getApps()[0];
      }
      _adminAuth = getAuth(adminApp);
    }
    return _adminAuth;
  } catch (err) {
    console.warn('[Firebase Admin] Warning: Failed to initialize Firebase Admin SDK auth client:', err);
    return null;
  }
}

export const adminAuth = {
  verifyIdToken: async (token: string) => {
    const auth = getAdminAuth();
    if (!auth) {
      throw new Error('Firebase Admin Auth is not initialized');
    }
    return auth.verifyIdToken(token);
  },
};

