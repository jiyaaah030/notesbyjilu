import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

import type { Auth } from 'firebase-admin/auth';

let adminAuth: Auth;

try {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY');
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  const app =
    getApps().length === 0
      ? initializeApp({
          credential: cert(serviceAccount),
        })
      : getApps()[0];

  adminAuth = getAuth(app);

  console.log('Firebase Admin initialized successfully');
} catch {
  console.log(
    'Failed to initialize Firebase Admin from FIREBASE_SERVICE_ACCOUNT_KEY'
  );
}

export { adminAuth };