<script setup lang="ts">
import type { Material } from '../../types'

defineProps<{ materials: Material[] }>()
</script>

<template>
  <div class="inventory-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>SKU</th>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Stock Actual</th>
          <th>Reservado</th>
          <th>Disponible</th>
          <th>Umbral</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="mat in materials" :key="mat.id" :class="{ 'low-stock': mat.currentStock < mat.lowStockThreshold }">
          <td>{{ mat.sku }}</td>
          <td>{{ mat.name }}</td>
          <td>{{ mat.type }}</td>
          <td class="text-center">{{ mat.currentStock }}</td>
          <td class="text-center">{{ mat.reservedStock }}</td>
          <td class="text-center">{{ mat.currentStock - mat.reservedStock }}</td>
          <td class="text-center">{{ mat.lowStockThreshold }}</td>
          <td>
            <span v-if="mat.currentStock < mat.lowStockThreshold" class="status-badge status-fallida">⚠️ Bajo</span>
            <span v-else class="status-badge status-completed">✅ OK</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.inventory-table-wrapper { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
.data-table th { font-weight: 600; color: #666; font-size: 13px; background: #f8f9fa; }
.data-table tr.low-stock { background: #fff8e1; }
.text-center { text-align: center; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-completed { background: #e8f5e9; color: #2e7d32; }
.status-fallida { background: #ffebee; color: #c62828; }
</style>

