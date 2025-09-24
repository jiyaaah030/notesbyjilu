import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp as initApp, cert } from 'firebase-admin/app';

if (!getApps().length) {
  initApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}')),
  });
}

export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
