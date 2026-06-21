<script setup lang="ts">
import { onMounted } from 'vue'
import { useOrders } from '../composables/useOrders'
import { useInventory } from '../composables/useInventory'
import StatusBadge from '../components/common/StatusBadge.vue'
import OrdersChart from '../components/charts/OrdersChart.vue'
import InventoryChart from '../components/charts/InventoryChart.vue'

const { orders, loading: ordersLoading, completedOrders, failedOrders, processingOrders, fetchOrders } = useOrders()
const { materials, lowStockMaterials, loading: inventoryLoading, fetchInventory } = useInventory()

onMounted(() => {
  fetchOrders()
  fetchInventory()
})
</script>

<template>
  <div class="dashboard">
    <h1 class="page-title">📊 Dashboard</h1>

    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-value">{{ orders.length }}</span>
        <span class="metric-label">Total Órdenes</span>
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
        <h3>Órdenes por Estado</h3>
        <OrdersChart :orders="orders" />
      </div>
      <div class="chart-card">
        <h3>Inventario por Material</h3>
        <InventoryChart :materials="materials" />
      </div>
    </div>

    <div class="recent-orders">
      <h3>Órdenes Recientes</h3>
      <div v-if="ordersLoading" class="loading">Cargando...</div>
      <table v-else class="data-table">
        <thead>
          <tr><th>ID</th><th>Estado</th><th>Caja</th><th>Fecha</th></tr>
        </thead>
        <tbody>
          <tr v-for="order in orders.slice(0, 10)" :key="order.id">
            <td>{{ order.shopifyOrderId }}</td>
            <td><StatusBadge :status="order.status" /></td>
            <td>{{ order.boxType ?? '—' }}</td>
            <td>{{ new Date(order.createdAt).toLocaleDateString('es') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.dashboard { max-width: 1400px; margin: 0 auto; }
.page-title { font-size: 28px; margin-bottom: 24px; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
.metric-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; align-items: center; }
.metric-card.success { border-left: 4px solid #2e7d32; }
.metric-card.error { border-left: 4px solid #c62828; }
.metric-card.warning { border-left: 4px solid #f57f17; }
.metric-card.info { border-left: 4px solid #1565c0; }
.metric-value { font-size: 32px; font-weight: 700; }
.metric-label { font-size: 13px; color: #666; margin-top: 4px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
.chart-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.chart-card h3 { margin-bottom: 16px; font-size: 16px; }
.recent-orders { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.recent-orders h3 { margin-bottom: 16px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { font-weight: 600; color: #666; font-size: 13px; }
.loading { text-align: center; padding: 40px; color: #666; }
</style>

