// firebase.js - Initialises the Firebase Admin SDK for our server-side use.
// The Admin SDK lets the backend verify Firebase ID tokens sent by the frontend.
//
// The private key is stored as a single-line string in .env with literal \n characters;
// the .replace() call then converts them back into real newlines as required by the SDK.

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

module.exports = admin;
