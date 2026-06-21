<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="empty-state">
    <span class="empty-icon">📭</span>
    <p>{{ message || 'No hay datos para mostrar' }}</p>
  </div>
</template>

<style scoped>
.empty-state { text-align: center; padding: 60px 20px; color: #999; }
.empty-icon { font-size: 48px; display: block; margin-bottom: 16px; }
.empty-state p { font-size: 16px; }
</style>

