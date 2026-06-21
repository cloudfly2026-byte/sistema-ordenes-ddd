<script setup lang="ts">
import { useUiStore } from '../../stores/ui.store'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const uiStore = useUiStore()
const route = useRoute()

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/orders', label: 'Órdenes', icon: '📦' },
  { path: '/inventory', label: 'Inventario', icon: '📋' },
  { path: '/low-stock', label: 'Bajo Stock', icon: '⚠️' },
]

const isActive = (path: string) => route.path === path
</script>

<template>
  <aside :class="['sidebar', { collapsed: !uiStore.sidebarOpen }]">
    <nav class="nav-menu">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['nav-item', { active: isActive(item.path) }]"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span v-if="uiStore.sidebarOpen" class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar { width: 250px; background: #1a1a2e; color: white; position: fixed; top: 0; left: 0; height: 100vh; transition: width 0.3s; z-index: 100; }
.sidebar.collapsed { width: 60px; }
.nav-menu { padding: 16px 0; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #b0b0b0; text-decoration: none; transition: background 0.2s; }
.nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
.nav-item.active { background: rgba(21,101,192,0.3); color: white; border-right: 3px solid #1565c0; }
.nav-icon { font-size: 18px; }
.nav-label { font-size: 14px; white-space: nowrap; }
</style>

