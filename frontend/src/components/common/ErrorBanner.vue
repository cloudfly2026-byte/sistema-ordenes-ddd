<script setup lang="ts">
defineProps<{ message: string }>()
</script>

<template>
  <div class="error-banner">
    <span class="error-icon">⚠️</span>
    <span class="error-text">{{ message }}</span>
  </div>
</template>

<style scoped>
.error-banner { display: flex; align-items: center; gap: 12px; background: #ffebee; color: #c62828; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.error-icon { font-size: 20px; }
.error-text { font-size: 14px; }
</style>

