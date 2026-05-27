import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken;
}
