<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOrders } from '../composables/useOrders'
import StatusBadge from '../components/common/StatusBadge.vue'
import OrderFilters from '../components/orders/OrderFilters.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const { orders, loading, error, fetchOrders } = useOrders()
const filterStatus = ref<string>('')

onMounted(() => fetchOrders())

function handleFilter(status: string) {
  filterStatus.value = status
  fetchOrders(status ? { status } : undefined)
}
</script>

<template>
  <div class="orders-page">
    <div class="page-header">
      <h1 class="page-title">📦 Órdenes</h1>
      <button @click="fetchOrders()" class="btn btn-primary">🔄 Actualizar</button>
    </div>

    <OrderFilters :current-filter="filterStatus" @filter="handleFilter" />

    <div v-if="loading" class="loading-container"><LoadingSpinner /></div>
    <div v-else-if="error" class="error-banner">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="empty-state">No hay órdenes para mostrar</div>

    <div v-else class="orders-grid">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="order-id">#{{ order.shopifyOrderId }}</span>
          <StatusBadge :status="order.status" />
        </div>
        <div class="order-body">
          <p><strong>Email:</strong> {{ order.customerEmail ?? 'N/A' }}</p>
          <p><strong>Caja:</strong> {{ order.boxType ?? 'Sin asignar' }}</p>
          <p><strong>Frágiles:</strong> {{ order.hasFragileItems ? 'Sí' : 'No' }}</p>
          <p><strong>Total:</strong> ${{ order.totalPrice.toFixed(2) }}</p>
        </div>
        <div class="order-footer">
          <span class="date">{{ new Date(order.createdAt).toLocaleString('es') }}</span>
          <router-link :to="`/orders/${order.id}`" class="btn btn-sm">Ver detalle</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page { max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 28px; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; }
.btn-primary { background: #1565c0; color: white; }
.btn-sm { padding: 4px 12px; font-size: 12px; background: #e3f2fd; color: #1565c0; text-decoration: none; }
.loading-container { display: flex; justify-content: center; padding: 60px; }
.error-banner { background: #ffebee; color: #c62828; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.empty-state { text-align: center; padding: 60px; color: #666; }
.orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.order-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.order-id { font-weight: 600; font-size: 16px; }
.order-body p { margin: 4px 0; font-size: 14px; color: #555; }
.order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
.date { font-size: 12px; color: #999; }
</style>

