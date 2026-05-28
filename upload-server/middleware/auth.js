const admin = require("firebase-admin");

const fs = require('fs');

let serviceAccount = null;

// Preferred: use JSON file (avoids brittle env JSON escaping)
try {
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE;
  if (filePath) {
    const resolved = require('path').isAbsolute(filePath)
      ? filePath
      : require('path').join(__dirname, '..', filePath);
    serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  }
} catch (e) {
  console.error('Failed to read/parse FIREBASE_SERVICE_ACCOUNT_KEY_FILE', e.message);
}

// Fallback: allow inline env JSON if provided
try {
  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }
} catch (e) {
  console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY (must be valid JSON).", e.message);
}


// Only initialize Firebase Admin if we have a valid service account.
if (!admin.apps.length && serviceAccount) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully with service account");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error.message);
  }
}

if (!admin.apps.length && !serviceAccount) {
  // Avoid crashing the server on startup; routes will return 401.
  console.warn("Firebase Admin not initialized: missing/invalid FIREBASE_SERVICE_ACCOUNT_KEY");
}


async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    console.log("Auth header:", authHeader ? "present" : "missing");
    console.log("Token:", token ? "present" : "missing");

    if (!token) return res.status(401).json({ error: "Missing token" });

    const decoded = await admin.auth().verifyIdToken(token);
    console.log("Token verified for user:", decoded.uid);
    req.user = decoded; // contains uid
    next();
  } catch (e) {
    console.error("Token verification error:", e.message);
    res.status(401).json({ error: "Invalid token", details: e.message });
  }
}

module.exports = { verifyFirebaseToken };
