import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import type { Task } from '../types'

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID'
}

let app: ReturnType<typeof initializeApp> | null = null
let firestore: ReturnType<typeof getFirestore> | null = null

function initFirebase() {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig)
      firestore = getFirestore(app)
    } catch (error) {
      console.error('Firebase initialization error:', error)
    }
  }
  return { app, firestore }
}

export function useFirebase() {
  const { firestore: db } = initFirebase()

  /**
   * Save a task to Firestore
   */
  async function saveTask(task: Task): Promise<string> {
    if (!db) {
      throw new Error('Firestore not initialized')
    }

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

  /**
   * Get tasks for a user (by userToken)
   */
  async function getUserTasks(userToken: string): Promise<Task[]> {
    if (!db) {
      throw new Error('Firestore not initialized')
    }

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
    saveTask,
    getUserTasks
  }
}
