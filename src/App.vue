<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import './assets/app.css'

import MainScreen from './components/MainScreen.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import AuthDialog from './components/AuthDialog.vue'

import { useAuth } from './composables/useAuth'
import { useSyncManager } from './composables/useSyncManager'
import { useOnlineStatus } from './composables/useOnlineStatus'

const { isAuthenticated, user, logout } = useAuth()
const { syncStatus, pendingCount, lastSync } = useSyncManager()
const { isOnline } = useOnlineStatus()

const settingsDialog = ref<InstanceType<typeof SettingsDialog> | null>(null)
const authDialog = ref<InstanceType<typeof AuthDialog> | null>(null)

const showMainApp = computed(() => isAuthenticated.value)

function openSettings() {
  settingsDialog.value?.open()
}

onMounted(() => {
  // If not authenticated, show auth dialog
  if (!isAuthenticated.value) {
    authDialog.value?.open()
  }
})
</script>

<template>
  <section class="section" data-label="main-section">
    <div class="container" style="max-width: 600px;" data-label="app-container">
      <div class="box" data-label="card-wrapper">
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-4" data-label="header">
          <h1 class="title is-4 mb-0" data-label="app-title">SCAN DONE</h1>
          <div class="is-flex is-gap-2 is-align-items-center" data-label="header-controls">
            <span 
              v-if="!isOnline" 
              class="tag is-warning is-light"
              title="App is offline - changes will sync when connection restored"
              data-label="offline-indicator"
            >
              ⚠ Offline
            </span>
            <span 
              v-if="pendingCount > 0" 
              class="tag is-info is-light"
              :title="`${pendingCount} changes pending sync`"
              data-label="pending-count-indicator"
            >
              🔄 {{ pendingCount }}
            </span>
            <button
              class="button is-small is-ghost px-1 is-size-5"
              @click="openSettings"
              data-label="settings-button"
              aria-label="Settings"
            >
              ⚙
            </button>
          </div>
        </div>

        <!-- Main app content when authenticated -->
        <MainScreen v-if="showMainApp" data-label="main-content" />

        <!-- Auth required message -->
        <div v-else class="has-text-centered p-5" data-label="auth-loading">
          <p class="mb-4">Authenticating...</p>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <SettingsDialog
      ref="settingsDialog"
      :user="user"
      @logout="logout"
      data-label="settings-dialog"
    />

    <AuthDialog
      ref="authDialog"
      @authenticated="authDialog?.close()"
      data-label="auth-dialog"
    />
  </section>
</template>
