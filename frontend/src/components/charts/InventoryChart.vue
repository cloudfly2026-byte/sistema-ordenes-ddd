<script setup lang="ts">
import { computed } from 'vue'
import type { Material } from '../../types'

const props = defineProps<{ materials: Material[] }>()


const chartData = computed(() => {
  const sorted = [...props.materials].sort((a, b) => b.currentStock - a.currentStock)
  return sorted.slice(0, 8).map(m => ({
    label: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
    value: m.currentStock,
    color: m.currentStock < m.lowStockThreshold ? '#c62828' : '#1565c0',
  }))
})

const maxValue = computed(() => Math.max(...chartData.value.map(d => d.value), 1))
</script>

<template>
  <div class="inventory-chart">
    <div class="chart-bars">
      <div v-for="item in chartData" :key="item.label" class="bar-row">
        <span class="bar-label" :title="item.label">{{ item.label }}</span>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: (item.value / maxValue * 100) + '%', backgroundColor: item.color }"></div>
        </div>
        <span class="bar-value" :style="{ color: item.color }">{{ item.value }}</span>
      </div>
    </div>
    <div v-if="chartData.length === 0" class="chart-empty">Sin datos</div>
  </div>
</template>

<style scoped>
.inventory-chart { padding: 16px 0; }
.chart-bars { display: flex; flex-direction: column; gap: 10px; }
.bar-row { display: flex; align-items: center; gap: 12px; }
.bar-label { width: 100px; font-size: 12px; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar-track { flex: 1; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; min-width: 4px; }
.bar-value { width: 30px; text-align: right; font-weight: 700; font-size: 13px; }
.chart-empty { text-align: center; color: #999; padding: 20px; }
</style>

