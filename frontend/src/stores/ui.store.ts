import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)
  const darkMode = ref(false)
  const currentView = ref('dashboard')
  const notification = ref<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)

  const isSidebarOpen = computed(() => sidebarOpen.value)

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function setSidebarOpen(open: boolean) {
    sidebarOpen.value = open
  }

  function toggleDarkMode() {
    darkMode.value = !darkMode.value
  }

  function setCurrentView(view: string) {
    currentView.value = view
  }

  function showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string) {
    notification.value = { type, message }
    setTimeout(() => { notification.value = null }, 5000)
  }

  function clearNotification() {
    notification.value = null
  }

  return {
    sidebarOpen, darkMode, currentView, notification,
    isSidebarOpen, toggleSidebar, setSidebarOpen,
    toggleDarkMode, setCurrentView,
    showNotification, clearNotification,
  }
})

