<script setup lang="ts">
import { ref } from 'vue'
import type { AuthUser } from '../types'

interface Props {
  user: AuthUser | null
}

defineProps<Props>()

const emit = defineEmits<{
  logout: []
}>()

const isOpen = ref(false)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    emit('logout')
    close()
  }
}

defineExpose({ open, close })
</script>

<template>
  <div class="modal" :class="{ 'is-active': isOpen }" data-label="settings-modal">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card" data-label="settings-modal-card">
      <header class="modal-card-head" data-label="settings-modal-header">
        <p class="modal-card-title">Settings</p>
        <button class="delete" @click="close" aria-label="close"></button>
      </header>
      <section class="modal-card-body" data-label="settings-modal-body">
        <div class="content">
          <h3 class="title is-5" data-label="account-section">Account</h3>
          <p v-if="user" class="mb-3" data-label="user-id-display">
            <strong>User ID:</strong><br />
            <code style="font-size: 0.85rem; word-break: break-all">{{ user.id }}</code>
          </p>
          <p v-if="user" class="mb-3" data-label="user-created-display">
            <strong>Created:</strong><br />
            {{ new Date(user.createdAt).toLocaleDateString() }}
          </p>

          <hr />

          <h3 class="title is-5" data-label="privacy-section">Privacy</h3>
          <p class="mb-3" data-label="privacy-info">
            No personal information is stored. All data is identified only by a random user token.
          </p>

          <hr />

          <h3 class="title is-5" data-label="data-section">Data</h3>
          <p class="mb-3" data-label="data-info">
            Tasks are stored locally first and synced to Firebase when online.
          </p>
        </div>
      </section>
      <footer class="modal-card-foot is-justify-content-space-between" data-label="settings-modal-footer">
        <button class="button" @click="close" data-label="close-settings-button">Close</button>
        <button class="button is-danger" @click="handleLogout" data-label="logout-button">Logout</button>
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
