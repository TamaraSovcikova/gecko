// firebase.js - Initialises the Firebase Admin SDK for our server-side use.
// The Admin SDK lets the backend verify Firebase ID tokens sent by the frontend.
//
// The private key is stored as a single-line string in .env with literal \n characters;
// the .replace() call then converts them back into real newlines as required by the SDK.

const admin = require('firebase-admin');

const projectId   = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.warn(
    '[firebase] Admin SDK NOT initialised - missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY. ' +
    'Auth-protected routes will return 503 until credentials are added to server/.env.'
  );
  module.exports = null;
} else {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  module.exports = admin;
}
