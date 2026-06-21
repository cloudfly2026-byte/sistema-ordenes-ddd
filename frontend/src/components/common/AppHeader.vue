<script setup lang="ts">
import { useUiStore } from '../../stores/ui.store'

const uiStore = useUiStore()
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button @click="uiStore.toggleSidebar()" class="menu-btn">☰</button>
      <span class="brand">🛒 Shopify Orders</span>
    </div>
    <div class="header-right">
      <button @click="uiStore.toggleDarkMode()" class="icon-btn">
        {{ uiStore.darkMode ? '☀️' : '🌙' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: white; border-bottom: 1px solid #e0e0e0; }
.header-left { display: flex; align-items: center; gap: 16px; }
.menu-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px 8px; }
.brand { font-size: 18px; font-weight: 700; }
.header-right { display: flex; align-items: center; gap: 8px; }
.icon-btn { background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px 8px; }
</style>

