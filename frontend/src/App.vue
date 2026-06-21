<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import AppSidebar from './components/common/AppSidebar.vue'
import { useUiStore } from './stores/ui.store'
import { storeToRefs } from 'pinia'

const uiStore = useUiStore()
const { sidebarOpen, darkMode, notification } = storeToRefs(uiStore)
</script>

<template>
  <div :class="['app-container', { 'dark-mode': darkMode, 'sidebar-collapsed': !sidebarOpen }]">
    <AppSidebar />
    <div class="main-content">
      <AppHeader />
      <main class="content-area">
        <RouterView />
      </main>
    </div>
    <div v-if="notification" :class="['notification', `notification-${notification.type}`]">
      {{ notification.message }}
      <button @click="uiStore.clearNotification()" class="close-btn">&times;</button>
    </div>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f7fa; color: #1a1a2e; }
.app-container { display: flex; min-height: 100vh; }
.main-content { flex: 1; display: flex; flex-direction: column; margin-left: 250px; transition: margin-left 0.3s; }
.sidebar-collapsed .main-content { margin-left: 60px; }
.content-area { padding: 24px; flex: 1; }
.dark-mode { background: #1a1a2e; color: #e0e0e0; }
.notification { position: fixed; top: 20px; right: 20px; padding: 12px 24px; border-radius: 8px; color: white; z-index: 1000; display: flex; align-items: center; gap: 12px; }
.notification-success { background: #2e7d32; }
.notification-error { background: #c62828; }
.notification-warning { background: #f57f17; }
.notification-info { background: #1565c0; }
.close-btn { background: none; border: none; color: white; font-size: 18px; cursor: pointer; }
</style>

