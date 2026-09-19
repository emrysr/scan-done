<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useTasks } from '../composables/useTasks'

const emit = defineEmits<{
  authenticated: []
}>()

const isOpen = ref(true)
const isLoading = ref(false)
const error = ref('')

const { authenticate, loginWithGoogle, userToken } = useAuth()

async function completeAuthentication(authenticateFn: () => Promise<boolean>) {
  isLoading.value = true
  error.value = ''

  try {
    await authenticateFn()
    
    // Load tasks for the authenticated user
    if (userToken.value) {
      const { loadTasks } = useTasks(userToken.value)
      await loadTasks()
    }

    function handleAuthenticate() {
      return completeAuthentication(authenticate)
    }

    function handleGoogleAuthenticate() {
      return completeAuthentication(loginWithGoogle)
    }
    
    close()
    emit('authenticated')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Authentication failed'
  } finally {
    isLoading.value = false
  }
}

function close() {
  isOpen.value = false
}

defineExpose({ close })
</script>

<template>
  <div class="modal" :class="{ 'is-active': isOpen }" data-label="auth-modal">
    <div class="modal-background"></div>
    <div class="modal-card" data-label="auth-modal-card">
      <header class="modal-card-head" data-label="auth-modal-header">
        <p class="modal-card-title">Scan Done</p>
      </header>
      <section class="modal-card-body" data-label="auth-modal-body">
        <div class="content has-text-centered">
          <p class="mb-4" data-label="welcome-text">Welcome to Scan Done</p>
          <p class="mb-4" style="font-size: 0.95rem; color: var(--text-l);" data-label="description-text">
            A simple maintenance log for your property.
          </p>
          <p class="mb-5" style="font-size: 0.9rem; color: var(--text-l);" data-label="privacy-text">
            We don't store any personal information — just your maintenance tasks.
          </p>

          <div v-if="error" class="notification is-danger is-light mb-4" data-label="error-message">
            {{ error }}
          </div>
        </div>
      </section>
      <footer class="modal-card-foot is-justify-content-center" data-label="auth-modal-footer">
        <div class="buttons is-flex-direction-column is-align-items-stretch">
          <button
            class="button is-primary is-large"
            :disabled="isLoading"
            @click="handleGoogleAuthenticate"
            data-label="google-sign-in-button"
          >
            {{ isLoading ? 'Authenticating...' : 'Continue with Google' }}
          </button>
          <button
            class="button is-light"
            :disabled="isLoading"
            @click="handleAuthenticate"
            data-label="local-start-button"
          >
            Use offline-only mode
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-card {
  width: 90%;
  max-width: 500px;
}
</style>
