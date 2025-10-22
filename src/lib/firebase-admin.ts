import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp as initApp, cert } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

if (!getApps().length) {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
  } catch {
    // Fallback to reading from file
    const filePath = path.join(process.cwd(), 'upload-server', 'firebase-service-account.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      serviceAccount = JSON.parse(fileContent);
    } else {
      throw new Error('No valid Firebase service account found');
    }
  }

  try {
    initApp({
      credential: cert(serviceAccount),
    });
  } catch {
    console.warn('Failed to initialize Firebase Admin');
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
