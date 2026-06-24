<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useOrders } from '../composables/useOrders'
import { useInventory } from '../composables/useInventory'
import StatusBadge from '../components/common/StatusBadge.vue'
import OrdersChart from '../components/charts/OrdersChart.vue'
import InventoryChart from '../components/charts/InventoryChart.vue'

const {
  orders,
  total,
  loading: ordersLoading,
  error: ordersError,
  completedOrders,
  failedOrders,
  processingOrders,
  fetchOrders,
} = useOrders()

const {
  materials,
  lowStockMaterials,
  loading: inventoryLoading,
  error: inventoryError,
  fetchInventory,
} = useInventory()

const loading = computed(() => ordersLoading.value || inventoryLoading.value)
const totalOrders = computed(() => total.value || orders.value.length)

onMounted(() => {
  fetchOrders()
  fetchInventory()
})
</script>

<template>
  <div class="dashboard">
    <h1 class="page-title">Dashboard</h1>

    <div v-if="ordersError || inventoryError" class="error-banner">
      {{ ordersError || inventoryError }}
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-value">{{ totalOrders }}</span>
        <span class="metric-label">Total Ordenes</span>
      </div>
      <div class="metric-card success">
        <span class="metric-value">{{ completedOrders.length }}</span>
        <span class="metric-label">Completadas</span>
      </div>
      <div class="metric-card error">
        <span class="metric-value">{{ failedOrders.length }}</span>
        <span class="metric-label">Fallidas</span>
      </div>
      <div class="metric-card warning">
        <span class="metric-value">{{ processingOrders.length }}</span>
        <span class="metric-label">En Proceso</span>
      </div>
      <div class="metric-card info">
        <span class="metric-value">{{ materials.length }}</span>
        <span class="metric-label">Materiales</span>
      </div>
      <div class="metric-card error">
        <span class="metric-value">{{ lowStockMaterials.length }}</span>
        <span class="metric-label">Bajo Stock</span>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <h3>Ordenes por Estado</h3>
        <OrdersChart :orders="orders" />
      </div>
      <div class="chart-card">
        <h3>Inventario por Material</h3>
        <InventoryChart :materials="materials" />
      </div>
    </div>

    <div class="recent-orders">
      <h3>Ordenes Recientes</h3>
      <div v-if="loading" class="loading">Cargando...</div>
      <table v-else class="data-table">
        <thead>
          <tr><th>ID</th><th>Estado</th><th>Caja</th><th>Fecha</th></tr>
        </thead>
        <tbody>
          <tr v-for="order in orders.slice(0, 10)" :key="order.id">
            <td>{{ order.shopifyOrderId }}</td>
            <td><StatusBadge :status="order.status" /></td>
            <td>{{ order.boxType ?? '-' }}</td>
            <td>{{ new Date(order.createdAt).toLocaleDateString('es') }}</td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="4" class="empty-cell">No hay ordenes recientes</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.dashboard { max-width: 1400px; margin: 0 auto; }
.page-title { font-size: 28px; margin-bottom: 24px; }
.error-banner { background: #ffebee; color: #c62828; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
.metric-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; align-items: center; }
.metric-card.success { border-left: 4px solid #2e7d32; }
.metric-card.error { border-left: 4px solid #c62828; }
.metric-card.warning { border-left: 4px solid #f57f17; }
.metric-card.info { border-left: 4px solid #1565c0; }
.metric-value { font-size: 32px; font-weight: 700; }
.metric-label { font-size: 13px; color: #666; margin-top: 4px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
.chart-card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.chart-card h3 { margin-bottom: 16px; font-size: 16px; }
.recent-orders { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.recent-orders h3 { margin-bottom: 16px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { font-weight: 600; color: #666; font-size: 13px; }
.loading, .empty-cell { text-align: center; padding: 40px; color: #666; }
@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
}
</style>
