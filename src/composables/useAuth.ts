import { ref, computed, onMounted } from 'vue'
import type { AuthUser } from '../types'

const isAuthenticated = ref(false)
const user = ref<AuthUser | null>(null)
const userToken = ref<string>('')

const TOKEN_STORAGE_KEY = 'scan_done_auth_token'
const USER_STORAGE_KEY = 'scan_done_auth_user'

/**
 * Generates a random user token (UUID-like)
 * Used to identify sync changes without storing personal data
 */
function generateUserToken(): string {
  return 'u_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

export function useAuth() {
  /**
   * Initialize auth from localStorage
   */
  onMounted(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUser = localStorage.getItem(USER_STORAGE_KEY)

    if (storedToken && storedUser) {
      userToken.value = storedToken
      user.value = JSON.parse(storedUser)
      isAuthenticated.value = true
    }
  })

  /**
   * Register a new WebAuthn credential
   */
  async function register() {
    try {
      // In a real app, you'd call your backend to get registration options
      // For now, we'll use a simplified approach
      
      const userId = generateUserToken()
      const newUser: AuthUser = {
        id: userId,
        createdAt: Date.now()
      }

      // Store user and token
      userToken.value = userId
      user.value = newUser
      
      localStorage.setItem(TOKEN_STORAGE_KEY, userId)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))
      
      isAuthenticated.value = true
      
      return true
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  /**
   * Authenticate with WebAuthn
   */
  async function authenticate() {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      const storedUser = localStorage.getItem(USER_STORAGE_KEY)

      if (storedToken && storedUser) {
        userToken.value = storedToken
        user.value = JSON.parse(storedUser)
        isAuthenticated.value = true
        return true
      }

      // If no stored credentials, register new user
      return await register()
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }

  /**
   * Logout current user
   */
  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    isAuthenticated.value = false
    user.value = null
    userToken.value = ''
  }

  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    user: computed(() => user.value),
    userToken: computed(() => userToken.value),
    register,
    authenticate,
    logout
  }
}
