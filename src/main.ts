import { createApp } from 'vue'
import './style.css'
import './assets/app.css'
import App from './App.vue'
import 'bulma/css/bulma.min.css'

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(err => {
    console.log('Service Worker registration failed:', err)
  })
}

creatApp(App).mount('#app')
