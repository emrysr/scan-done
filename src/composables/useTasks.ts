import { ref, computed } from 'vue'
import type { Task } from '../types'

const DB_NAME = 'scan_done'
const DB_STORE = 'tasks'
let db: IDBDatabase | null = null

/**
 * Initialize IndexedDB for offline storage
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(DB_STORE)) {
        const store = database.createObjectStore(DB_STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('synced', 'synced', { unique: false })
      }
    }
  })
}

/**
 * Generate UUID for tasks
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const tasks = ref<Task[]>([])

export function useTasks(userToken: string) {
  /**
   * Load all tasks from IndexedDB
   */
  async function loadTasks() {
    const database = await initDB()
    return new Promise<Task[]>((resolve, reject) => {
      const transaction = database.transaction(DB_STORE, 'readonly')
      const store = transaction.objectStore(DB_STORE)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        // Sort by timestamp descending
        const result = (request.result as Task[]).sort((a, b) => b.timestamp - a.timestamp)
        tasks.value = result
        resolve(result)
      }
    })
  }

  /**
   * Add a new task
   */
  async function addTask(text: string): Promise<Task> {
    const database = await initDB()
    
    const newTask: Task = {
      id: generateUUID(),
      uuid: generateUUID(),
      text,
      timestamp: Date.now(),
      userToken,
      synced: false
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(DB_STORE, 'readwrite')
      const store = transaction.objectStore(DB_STORE)
      const request = store.add(newTask)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        tasks.value.unshift(newTask)
        resolve(newTask)
      }
    })
  }

  /**
   * Delete a task
   */
  async function deleteTask(id: string): Promise<void> {
    const database = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(DB_STORE, 'readwrite')
      const store = transaction.objectStore(DB_STORE)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        tasks.value = tasks.value.filter(t => t.id !== id)
        resolve()
      }
    })
  }

  /**
   * Get unsync'd tasks
   */
  async function getUnsyncedTasks(): Promise<Task[]> {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(DB_STORE, 'readonly')
      const store = transaction.objectStore(DB_STORE)
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        resolve(request.result as Task[])
      }
    })
  }

  /**
   * Mark task as synced
   */
  async function markAsSynced(id: string): Promise<void> {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(DB_STORE, 'readwrite')
      const store = transaction.objectStore(DB_STORE)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const task = request.result as Task
        task.synced = true
        task.syncedAt = Date.now()
        const updateRequest = store.put(task)
        updateRequest.onerror = () => reject(updateRequest.error)
        updateRequest.onsuccess = () => {
          const taskIndex = tasks.value.findIndex(t => t.id === id)
          if (taskIndex !== -1) {
            tasks.value[taskIndex] = task
          }
          resolve()
        }
      }
    })
  }

  return {
    tasks: computed(() => tasks.value),
    loadTasks,
    addTask,
    deleteTask,
    getUnsyncedTasks,
    markAsSynced
  }
}
