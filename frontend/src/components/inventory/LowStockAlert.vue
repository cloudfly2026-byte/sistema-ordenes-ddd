<script setup lang="ts">
import type { LowStockAlert } from '../../types'

defineProps<{ alert: LowStockAlert }>()
</script>

<template>
  <div class="alert-card">
    <div class="alert-header">
      <span class="alert-icon">⚠️</span>
      <span class="alert-title">{{ alert.materialName }}</span>
    </div>
    <div class="alert-body">
      <p><strong>Stock Actual:</strong> <span class="text-error">{{ alert.currentStock }}</span></p>
      <p><strong>Umbral:</strong> {{ alert.threshold }}</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: Math.min(100, (alert.currentStock / alert.threshold) * 100) + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid #c62828; }
.alert-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.alert-icon { font-size: 20px; }
.alert-title { font-weight: 600; font-size: 16px; }
.alert-body p { margin: 4px 0; font-size: 14px; color: #555; }
.text-error { color: #c62828; font-weight: 700; }
.progress-bar { height: 8px; background: #eee; border-radius: 4px; margin-top: 12px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #c62828, #f57f17); border-radius: 4px; transition: width 0.3s; }
</style>

