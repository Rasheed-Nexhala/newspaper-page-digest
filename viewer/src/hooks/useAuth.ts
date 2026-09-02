import { useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithGoogle() {
    setError(null)
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    setUser(cred.user)
    return cred.user
  }

  async function signOutUser() {
    setError(null)
    await signOut(auth)
    setUser(null)
  }

  function setAuthError(message: string | null) {
    setError(message)
  }

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOutUser,
    setAuthError,
  }
}
