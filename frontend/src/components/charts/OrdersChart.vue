<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '../../types'

const props = defineProps<{ orders: Order[] }>()

const chartData = computed(() => {
  const counts: Record<string, number> = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 }
  props.orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1 })
  return [
    { label: 'Pendientes', value: counts.PENDING, color: '#f57f17' },
    { label: 'En Proceso', value: counts.PROCESSING, color: '#1565c0' },
    { label: 'Completadas', value: counts.COMPLETED, color: '#2e7d32' },
    { label: 'Fallidas', value: counts.FAILED, color: '#c62828' },
  ]
})

const total = computed(() => props.orders.length)
</script>

<template>
  <div class="orders-chart">
    <div class="chart-bars">
      <div v-for="item in chartData" :key="item.label" class="bar-row">
        <span class="bar-label">{{ item.label }}</span>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: total > 0 ? (item.value / total * 100) + '%' : '0%', backgroundColor: item.color }"></div>
        </div>
        <span class="bar-value" :style="{ color: item.color }">{{ item.value }}</span>
      </div>
    </div>
    <div v-if="total === 0" class="chart-empty">Sin datos</div>
  </div>
</template>

<style scoped>
.orders-chart { padding: 16px 0; }
.chart-bars { display: flex; flex-direction: column; gap: 12px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 100px; font-size: 13px; color: #555; }
.bar-track { flex: 1; height: 24px; background: #f0f0f0; border-radius: 12px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 12px; transition: width 0.5s ease; min-width: 4px; }
.bar-value { width: 30px; text-align: right; font-weight: 700; font-size: 14px; }
.chart-empty { text-align: center; color: #999; padding: 20px; }
</style>

