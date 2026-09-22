// services/firebaseService.js
//
// Firebase is OPTIONAL for NoorDaily's MVP. The app works fully offline
// using data/quran.js and data/hadith.js. This service exists so a future
// version can sync content or config from Firestore without requiring
// login — no authentication is used anywhere in this file.
//
// To enable it, set the EXPO_PUBLIC_FIREBASE_* environment variables and
// call initFirebase() once during app startup. Until those variables are
// present, every function below resolves to null/false rather than
// throwing, so the rest of the app keeps working offline-first.

let firebaseApp = null;
let firestoreDb = null;

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const isConfigured = Object.values(config).every(Boolean);
  return { config, isConfigured };
}

/**
 * Initializes Firebase only if all required env vars are present.
 * Safe to call multiple times.
 * @returns {boolean} whether Firebase is now initialized
 */
export async function initFirebase() {
  const { config, isConfigured } = getFirebaseConfig();
  if (!isConfigured) {
    return false;
  }
  if (firebaseApp) return true;

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');

    firebaseApp = getApps().length ? getApps()[0] : initializeApp(config);
    firestoreDb = getFirestore(firebaseApp);
    return true;
  } catch (e) {
    console.warn('firebaseService: init failed, continuing offline-only', e);
    return false;
  }
}

export function isFirebaseReady() {
  return Boolean(firebaseApp && firestoreDb);
}

/**
 * Fetches remote quranAyahs collection, if Firebase is configured.
 * Returns null when unavailable so callers can fall back to bundled data.
 */
export async function fetchRemoteQuranAyahs() {
  if (!isFirebaseReady()) return null;
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(firestoreDb, 'quranAyahs'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.warn('firebaseService: fetchRemoteQuranAyahs failed', e);
    return null;
  }
}

/**
 * Fetches remote hadiths collection, if Firebase is configured.
 */
export async function fetchRemoteHadiths() {
  if (!isFirebaseReady()) return null;
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(collection(firestoreDb, 'hadiths'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.warn('firebaseService: fetchRemoteHadiths failed', e);
    return null;
  }
}

/**
 * Fetches remote appConfig document, if Firebase is configured.
 */
export async function fetchRemoteAppConfig() {
  if (!isFirebaseReady()) return null;
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(firestoreDb, 'appConfig', 'default'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('firebaseService: fetchRemoteAppConfig failed', e);
    return null;
  }
}

export default {
  initFirebase,
  isFirebaseReady,
  fetchRemoteQuranAyahs,
  fetchRemoteHadiths,
  fetchRemoteAppConfig,
};
