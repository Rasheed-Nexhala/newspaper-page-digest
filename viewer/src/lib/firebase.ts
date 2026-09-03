import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCfGcgzZfSunMKXj-snvfuhjOq4il-rTTQ',
  authDomain: 'newspaper-page-digest.firebaseapp.com',
  projectId: 'newspaper-page-digest',
  storageBucket: 'newspaper-page-digest.firebasestorage.app',
  messagingSenderId: '20736600304',
  appId: '1:20736600304:web:56b7ee9fca02fc41c7fa35',
} as const

function viteEnv(name: string): string | undefined {
  const value = import.meta.env[name]
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/** Empty GitHub secrets become "" at build time — treat those like unset. */
const firebaseConfig = {
  apiKey: viteEnv('VITE_FIREBASE_API_KEY') ?? DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain:
    viteEnv('VITE_FIREBASE_AUTH_DOMAIN') ?? DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId:
    viteEnv('VITE_FIREBASE_PROJECT_ID') ?? DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket:
    viteEnv('VITE_FIREBASE_STORAGE_BUCKET') ??
    DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    viteEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') ??
    DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: viteEnv('VITE_FIREBASE_APP_ID') ?? DEFAULT_FIREBASE_CONFIG.appId,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
