<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ currentFilter: string }>()
const emit = defineEmits<{ filter: [status: string] }>()

const filters = [
  { value: '', label: 'Todas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'PROCESSING', label: 'En Proceso' },
  { value: 'COMPLETED', label: 'Completadas' },
  { value: 'FAILED', label: 'Fallidas' },
]

const selected = ref(props.currentFilter)

watch(() => props.currentFilter, (val) => { selected.value = val })

function applyFilter(value: string) {
  selected.value = value
  emit('filter', value)
}
</script>

<template>
  <div class="filters-bar">
    <button
      v-for="f in filters"
      :key="f.value"
      :class="['filter-btn', { active: selected === f.value }]"
      @click="applyFilter(f.value)"
    >
      {{ f.label }}
    </button>
  </div>
</template>

<style scoped>
.filters-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
.filter-btn { padding: 8px 16px; border-radius: 20px; border: 1px solid #e0e0e0; background: white; cursor: pointer; font-size: 13px; transition: all 0.2s; }
.filter-btn:hover { border-color: #1565c0; color: #1565c0; }
.filter-btn.active { background: #1565c0; color: white; border-color: #1565c0; }
</style>

