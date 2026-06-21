<script setup lang="ts">
import { onMounted } from 'vue'
import { useInventory } from '../composables/useInventory'
import LowStockAlert from '../components/inventory/LowStockAlert.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const { lowStockAlerts, lowStockMaterials, loading, error, fetchLowStock, fetchInventory } = useInventory()

onMounted(() => {
  fetchLowStock()
  fetchInventory()
})
</script>

<template>
  <div class="low-stock-page">
    <div class="page-header">
      <h1 class="page-title">⚠️ Alertas de Bajo Stock</h1>
      <button @click="fetchLowStock()" class="btn btn-primary">🔄 Actualizar</button>
    </div>

    <div v-if="loading" class="loading-container"><LoadingSpinner /></div>
    <div v-else-if="error" class="error-banner">{{ error }}</div>
    <div v-else-if="lowStockAlerts.length === 0" class="empty-state">✅ No hay alertas de bajo stock</div>

    <div v-else class="alerts-grid">
      <LowStockAlert v-for="alert in lowStockAlerts" :key="alert.materialId" :alert="alert" />
    </div>

    <div v-if="lowStockMaterials.length > 0" class="low-stock-table">
      <h3>Materiales Bajo Stock</h3>
      <table class="data-table">
        <thead>
          <tr><th>SKU</th><th>Nombre</th><th>Stock Actual</th><th>Umbral</th><th>Disponible</th></tr>
        </thead>
        <tbody>
          <tr v-for="mat in lowStockMaterials" :key="mat.id">
            <td>{{ mat.sku }}</td>
            <td>{{ mat.name }}</td>
            <td class="text-error">{{ mat.currentStock }}</td>
            <td>{{ mat.lowStockThreshold }}</td>
            <td>{{ mat.currentStock - mat.reservedStock }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.low-stock-page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 28px; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; }
.btn-primary { background: #1565c0; color: white; }
.loading-container { display: flex; justify-content: center; padding: 60px; }
.error-banner { background: #ffebee; color: #c62828; padding: 16px; border-radius: 8px; }
.empty-state { text-align: center; padding: 60px; color: #2e7d32; font-size: 18px; }
.alerts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 32px; }
.low-stock-table { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.low-stock-table h3 { margin-bottom: 16px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { font-weight: 600; color: #666; font-size: 13px; }
.text-error { color: #c62828; font-weight: 600; }
</style>

