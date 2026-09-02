import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type QueryDocumentSnapshot,
  type Timestamp,
} from 'firebase/firestore'
import type { SavedArticle } from '../types'
import { makeSavedArticleId } from './articleId'
import { db } from './firebase'

export { makeSavedArticleId } from './articleId'

type SavedArticleRecord = Omit<SavedArticle, 'saved_at'> & {
  saved_at?: string | Timestamp
}

function normalizeSavedArticle(docSnap: QueryDocumentSnapshot): SavedArticle {
  const data = docSnap.data() as SavedArticleRecord
  const savedAt =
    typeof data.saved_at === 'string'
      ? data.saved_at
      : data.saved_at?.toDate().toISOString() ?? ''
  return {
    ...data,
    id: docSnap.id,
    saved_at: savedAt,
  }
}

export function subscribeSavedArticles(
  uid: string,
  onData: (items: SavedArticle[]) => void,
  onError: (message: string) => void,
) {
  const ref = collection(db, 'users', uid, 'saved_articles')
  const q = query(ref, orderBy('saved_at', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(normalizeSavedArticle))
    },
    (err) => onError(err.message),
  )
}

export async function saveArticle(uid: string, article: SavedArticle): Promise<void> {
  const id = makeSavedArticleId(article)
  const ref = doc(db, 'users', uid, 'saved_articles', id)
  await setDoc(
    ref,
    {
      ...article,
      id,
      saved_at: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function unsaveArticle(uid: string, articleId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'saved_articles', articleId)
  await deleteDoc(ref)
}
