import { ref, computed } from 'vue'
import { useAuth } from './useAuth'
import { useTasks } from './useTasks'
import { useFirebase } from './useFirebase'

const syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')
const lastSync = ref<number>(0)
const pendingCount = ref<number>(0)
const syncError = ref<string>('')

export function useSyncManager() {
  const { userToken, isAuthenticated } = useAuth()
  const firebase = useFirebase()

  /**
   * Sync pending tasks to Firebase
   */
  async function syncPendingTasks() {
    if (!isAuthenticated.value || !userToken.value) {
      return
    }

    syncStatus.value = 'syncing'
    syncError.value = ''

    try {
      const { getUnsyncedTasks, markAsSynced } = useTasks(userToken.value)
      const unsyncedTasks = await getUnsyncedTasks()

      if (unsyncedTasks.length === 0) {
        syncStatus.value = 'idle'
        lastSync.value = Date.now()
        pendingCount.value = 0
        return
      }

      // Send tasks to Firebase
      for (const task of unsyncedTasks) {
        try {
          await firebase.saveTask(task)
          await markAsSynced(task.id)
          pendingCount.value = Math.max(0, pendingCount.value - 1)
        } catch (error) {
          console.error('Failed to sync task:', error)
          // Task remains in queue for retry
        }
      }

      syncStatus.value = 'idle'
      lastSync.value = Date.now()
    } catch (error) {
      syncStatus.value = 'error'
      syncError.value = error instanceof Error ? error.message : 'Sync failed'
      console.error('Sync error:', error)
    }
  }

  /**
   * Calculate pending task count
   */
  async function updatePendingCount() {
    if (!isAuthenticated.value || !userToken.value) {
      pendingCount.value = 0
      return
    }

    const { getUnsyncedTasks } = useTasks(userToken.value)
    const unsyncedTasks = await getUnsyncedTasks()
    pendingCount.value = unsyncedTasks.length
  }

  return {
    syncStatus: computed(() => syncStatus.value),
    lastSync: computed(() => lastSync.value),
    pendingCount: computed(() => pendingCount.value),
    syncError: computed(() => syncError.value),
    syncPendingTasks,
    updatePendingCount
  }
}
