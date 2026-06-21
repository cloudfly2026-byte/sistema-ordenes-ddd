<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const statusConfig = computed(() => {
  const configs: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'Pendiente', class: 'status-pending' },
    PROCESSING: { label: 'Procesando', class: 'status-processing' },
    COMPLETED: { label: 'Completada', class: 'status-completed' },
    FAILED: { label: 'Fallida', class: 'status-failed' },
    CANCELLED: { label: 'Cancelada', class: 'status-cancelled' },
  }
  return configs[props.status] ?? { label: props.status, class: 'status-unknown' }
})
</script>

<template>
  <span :class="['status-badge', statusConfig.class]">{{ statusConfig.label }}</span>
</template>

<style scoped>
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-pending { background: #fff8e1; color: #f57f17; }
.status-processing { background: #e3f2fd; color: #1565c0; }
.status-completed { background: #e8f5e9; color: #2e7d32; }
.status-failed { background: #ffebee; color: #c62828; }
.status-cancelled { background: #f5f5f5; color: #666; }
.status-unknown { background: #f5f5f5; color: #999; }
</style>

