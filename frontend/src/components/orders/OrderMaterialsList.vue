<script setup lang="ts">
import type { OrderMaterial } from '../../types'

defineProps<{ materials: OrderMaterial[] }>()
</script>

<template>
  <div class="materials-section">
    <h3>Materiales Asignados</h3>
    <div v-if="materials.length === 0" class="empty-materials">No hay materiales asignados</div>
    <div v-else class="materials-grid">
      <div v-for="mat in materials" :key="mat.id" class="material-chip">
        <span class="material-type">{{ mat.materialType }}</span>
        <span class="material-qty">×{{ mat.quantity }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.materials-section { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-top: 24px; }
.materials-section h3 { margin-bottom: 16px; font-size: 16px; }
.empty-materials { color: #999; font-size: 14px; }
.materials-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.material-chip { display: flex; align-items: center; gap: 8px; background: #f5f7fa; padding: 8px 16px; border-radius: 20px; font-size: 13px; }
.material-type { font-weight: 600; }
.material-qty { color: #1565c0; font-weight: 700; }
</style>

