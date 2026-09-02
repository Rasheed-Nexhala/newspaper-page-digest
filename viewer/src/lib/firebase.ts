import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCfGcgzZfSunMKXj-snvfuhjOq4il-rTTQ',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    'newspaper-page-digest.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'newspaper-page-digest',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    'newspaper-page-digest.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '20736600304',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    '1:20736600304:web:56b7ee9fca02fc41c7fa35',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
