import { initializeApp } from 'firebase/app'
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth' // Add Auth imports
import type { Task } from '../types'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'scan-done.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'scan-done',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'scan-done.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '929528018231',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID'
}

let app: ReturnType<typeof initializeApp> | null = null
let db: ReturnType<typeof initializeFirestore> | null = null
let auth: ReturnType<typeof getAuth> | null = null

function initFirebase() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig)
      
      // Initialize Firestore with offline persistence
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      })

      // Initialize Auth
      auth = getAuth(app)
    } catch (error) {
      console.error('Firebase initialization error:', error)
    }
  }
  return { app, db, auth }
}

export function useFirebase() {
  const { db, auth } = initFirebase()
  const googleProvider = new GoogleAuthProvider()

  async function loginWithGoogle(): Promise<User | null> {
    if (!auth) throw new Error('Auth not initialized')
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }

  async function logout(): Promise<void> {
    if (!auth) throw new Error('Auth not initialized')
    await auth.signOut()
  }

  async function saveTask(task: Task): Promise<string> {
    if (!db) throw new Error('Firestore not initialized')

    const tasksCollection = collection(db, 'tasks')
    const docRef = await addDoc(tasksCollection, {
      uuid: task.uuid,
      text: task.text,
      timestamp: task.timestamp,
      userToken: task.userToken,
      createdAt: new Date()
    })

    return docRef.id
  }

  async function getUserTasks(userToken: string): Promise<Task[]> {
    if (!db) throw new Error('Firestore not initialized')

    const tasksCollection = collection(db, 'tasks')
    const q = query(tasksCollection, where('userToken', '==', userToken))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({
      id: doc.id,
      uuid: doc.data().uuid,
      text: doc.data().text,
      timestamp: doc.data().timestamp,
      userToken: doc.data().userToken,
      synced: true,
      syncedAt: Date.now()
    }))
  }

  return {
    loginWithGoogle,
    logout,
    saveTask,
    getUserTasks
  }
}
