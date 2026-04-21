import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Fix #1: All config from VITE_ env vars — no JSON file import needed.
// Set these in .env (local) and in Vercel/hosting dashboard (production).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize App Check with reCAPTCHA Enterprise (production only)
// In dev mode App Check blocks phone auth with network-request-failed because the
// debug token must be manually registered in the Firebase Console first.
// Skipping it in dev keeps auth working locally; production is still fully protected.
if (typeof window !== 'undefined' && !import.meta.env.DEV) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('✅ Firebase App Check initialized with reCAPTCHA Enterprise');
    } catch (err) {
      console.error('❌ Failed to initialize App Check:', err);
    }
  }
} else if (import.meta.env.DEV) {
  console.log('%c🛡️ APP CHECK SKIPPED IN DEV MODE', 'color: white; background: orange; padding: 4px 8px; font-weight: bold;');
}

const firestoreDatabaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID || '(default)';
export const db = getFirestore(app, firestoreDatabaseId);
export const storage = getStorage(app);

export { RecaptchaVerifier, signInWithPhoneNumber };
