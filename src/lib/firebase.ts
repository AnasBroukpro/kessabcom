import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Initialize App Check with reCAPTCHA Enterprise
if (typeof window !== 'undefined') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    try {
      // Allow debug token in development
      if (import.meta.env.DEV) {
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        console.log("%c🛡️ FIREBASE APP CHECK DEBUG MODE ACTIVE", "color: white; background: blue; padding: 5px; font-weight: bold;");
        console.warn("👉 Cherchez la ligne '[Firebase App Check] App Check debug token:' juste au-dessus pour copier votre jeton !");
      }

      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.log('✅ Firebase App Check initialized with reCAPTCHA Enterprise' + (import.meta.env.DEV ? ' (DEBUG MODE)' : ''));
    } catch (err) {
      console.error('❌ Failed to initialize App Check:', err);
    }
  }
}

const firestoreDatabaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID || '(default)';
export const db = getFirestore(app, firestoreDatabaseId);

export { RecaptchaVerifier, signInWithPhoneNumber };
