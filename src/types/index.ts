// Auth types
export interface AuthUser {
  id: string
  createdAt: number
}

export interface WebAuthnCredential {
  id: string
  publicKeySpki: string
  signCount: number
}

// Task types
export interface Task {
  id: string
  uuid: string
  text: string
  timestamp: number
  userToken: string
  synced: boolean
  syncedAt?: number
}

// Sync types
export interface SyncQueueItem {
  id: string
  task: Task
  retries: number
  lastRetryAt?: number
}

// Config types
export interface AppConfig {
  firebaseConfig: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
}
