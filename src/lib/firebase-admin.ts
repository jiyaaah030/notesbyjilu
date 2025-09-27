import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp as initApp, cert } from 'firebase-admin/app';

if (!getApps().length) {
  try {
    initApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
    });
  } catch (error) {
    console.warn('Failed to initialize Firebase Admin:', error);
    // Continue without Firebase for build purposes
  }
}

export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch {
    throw new Error('Invalid or expired token');
  }
}
