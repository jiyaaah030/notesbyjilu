const admin = require("firebase-admin");
const path = require("path");

// Load service account key from local file
const serviceAccount = require(path.join(__dirname, "../firebase-service-account.json"));

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully with service account");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error.message);
    console.error("Make sure firebase-service-account.json is in the upload-server directory");
  }
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
