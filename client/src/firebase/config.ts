// firebase/config.ts - Firebase client-side initialisation.
// Firebase client SDK is used in the browser to:
//   - Authenticate users (sign in, sign up, sign out)
//   - Obtain ID tokens sent to the Express backend for verification
//
// Firebase client - auth state used in AuthContext (context/ folder)

// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';

// const firebaseConfig = {
//   apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId:             import.meta.env.VITE_FIREBASE_APP_ID,
// };

// export const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
