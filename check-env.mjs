const v = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
console.log('FIREBASE_SERVICE_ACCOUNT_KEY present:', !!v);
console.log('length:', v ? v.length : 0);
if (v) {
  console.log('startsWith:', v.slice(0, 20));
  try {
    JSON.parse(v);
    console.log('JSON.parse: OK');
  } catch (e) {
    console.log('JSON.parse: FAIL:', e && e.message);
  }
}

