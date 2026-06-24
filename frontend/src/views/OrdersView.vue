<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOrders } from '../composables/useOrders'
import OrderFilters from '../components/orders/OrderFilters.vue'
import OrderCard from '../components/orders/OrderCard.vue'
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
      <h1 class="page-title">Ordenes</h1>
      <button @click="fetchOrders()" class="btn btn-primary">Actualizar</button>
    </div>

    <OrderFilters :current-filter="filterStatus" @filter="handleFilter" />

    <div v-if="loading" class="loading-container">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="error-banner">{{ error }}</div>
    <div v-else-if="orders.length === 0" class="empty-state">
      No hay ordenes para mostrar
    </div>

    <div v-else class="orders-grid">
      <OrderCard v-for="order in orders" :key="order.id || order.shopifyOrderId" :order="order" />
    </div>
  </div>
</template>

<style scoped>
.orders-page { max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 28px; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; }
.btn-primary { background: #1565c0; color: white; }
.loading-container { display: flex; justify-content: center; padding: 60px; }
.error-banner { background: #ffebee; color: #c62828; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
.empty-state { text-align: center; padding: 60px; color: #666; }
.orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
</style>
