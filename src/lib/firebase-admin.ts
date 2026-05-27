import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

import type { Auth } from 'firebase-admin/auth';

let adminAuth: Auth;

try {
  let serviceAccount: any | undefined;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch {
      // If env var is present but invalid, fall back to local JSON file.
      serviceAccount = undefined;
    }
  }


  // Fallback for dev/prod environments where env var is missing.
  if (!serviceAccount) {
    const { readFileSync, existsSync } = require('fs');
    const path = require('path');

    // Try project root first
    const accountPath = path.join(
      process.cwd(),
      'upload-server',
      'firebase-service-account.json'
    );

    // If build changes cwd, also try relative to this file
    const fallbackPath = path.join(
      __dirname,
      '..',
      '..',
      'upload-server',
      'firebase-service-account.json'
    );

    const finalPath = existsSync(accountPath) ? accountPath : fallbackPath;

    if (!existsSync(finalPath)) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY and firebase-service-account.json');
    }

    serviceAccount = JSON.parse(readFileSync(finalPath, 'utf8'));
  }


  const app =
    getApps().length === 0
      ? initializeApp({
          credential: cert(serviceAccount),
        })
      : getApps()[0];


  // Ensure we actually have an auth instance
  if (!app) {
    throw new Error('Failed to initialize firebase-admin app');
  }

  adminAuth = getAuth(app);

  console.log('Firebase Admin initialized successfully');
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.log(
    'Failed to initialize Firebase Admin. Error:',
    msg
  );
}



export { adminAuth };