<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useTasks } from '../composables/useTasks'
import { useSyncManager } from '../composables/useSyncManager'
import { useOnlineStatus } from '../composables/useOnlineStatus'

const { userToken } = useAuth()
const { tasks, loadTasks, addTask, deleteTask } = useTasks(userToken.value || '')
const { syncPendingTasks, updatePendingCount } = useSyncManager()
const { isOnline } = useOnlineStatus()

const taskInput = ref('')
const isLoading = ref(false)

onMounted(async () => {
  await loadTasks()
  await updatePendingCount()
})

// Watch for online status changes and sync if back online
watch(isOnline, async (newIsOnline) => {
  if (newIsOnline) {
    await syncPendingTasks()
  }
})

async function handleAddTask() {
  if (!taskInput.value.trim()) return

  isLoading.value = true
  try {
    await addTask(taskInput.value)
    taskInput.value = ''
    await updatePendingCount()
    
    // Try to sync if online
    if (isOnline.value) {
      await syncPendingTasks()
    }
  } catch (error) {
    console.error('Failed to add task:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteTask(id: string) {
  if (confirm('Delete this task?')) {
    try {
      await deleteTask(id)
      await updatePendingCount()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
</script>

<template>
  <div data-label="main-screen">
    <!-- Task input -->
    <div class="input-group mb-4" data-label="task-input-group">
      <input
        v-model="taskInput"
        type="text"
        class="input"
        placeholder="What maintenance task did you complete?"
        data-label="task-input-field"
        @keyup.enter="handleAddTask"
      />
      <button
        class="button is-primary"
        :disabled="!taskInput.trim() || isLoading"
        @click="handleAddTask"
        data-label="add-task-button"
      >
        {{ isLoading ? 'Adding...' : 'Add' }}
      </button>
    </div>

    <!-- Task list -->
    <div v-if="tasks.length > 0" class="task-list" data-label="task-list">
      <div v-for="task in tasks" :key="task.id" class="task-item" :data-label="`task-item-${task.id}`">
        <div class="task-text" data-label="task-text">{{ task.text }}</div>
        <div class="task-meta" data-label="task-meta">
          <span data-label="task-timestamp">{{ formatTime(task.timestamp) }}</span>
          <span 
            v-if="!task.synced" 
            class="tag is-warning is-light ml-2" 
            data-label="task-pending-badge"
          >
            Pending sync
          </span>
          <span 
            v-else 
            class="tag is-success is-light ml-2" 
            data-label="task-synced-badge"
          >
            Synced
          </span>
        </div>
        <button
          class="button is-small is-danger is-light mt-2"
          @click="handleDeleteTask(task.id)"
          :data-label="`delete-task-button-${task.id}`"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state" data-label="empty-state">
      <div class="empty-state-icon">📋</div>
      <p>No tasks yet. Add one to get started!</p>
    </div>
  </div>
</template>
