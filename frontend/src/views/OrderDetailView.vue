<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useOrders } from '../composables/useOrders'
import StatusBadge from '../components/common/StatusBadge.vue'
import OrderMaterialsList from '../components/orders/OrderMaterialsList.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const route = useRoute()
const { currentOrder, loading, error, fetchOrderById } = useOrders()

onMounted(() => {
  fetchOrderById(route.params.id as string)
})
</script>

<template>
  <div class="order-detail">
    <router-link to="/orders" class="back-link">← Volver a órdenes</router-link>

    <div v-if="loading" class="loading-container"><LoadingSpinner /></div>
    <div v-else-if="error" class="error-banner">{{ error }}</div>
    <div v-else-if="currentOrder" class="detail-content">
      <div class="detail-header">
        <h1>Orden #{{ currentOrder.shopifyOrderId }}</h1>
        <StatusBadge :status="currentOrder.status" />
      </div>

      <div class="detail-grid">
        <div class="detail-card">
          <h3>Información General</h3>
          <p><strong>ID Interno:</strong> {{ currentOrder.id }}</p>
          <p><strong>Email:</strong> {{ currentOrder.customerEmail ?? 'N/A' }}</p>
          <p><strong>Total:</strong> ${{ currentOrder.totalPrice.toFixed(2) }}</p>
          <p><strong>Tipo de Caja:</strong> {{ currentOrder.boxType ?? 'Sin asignar' }}</p>
          <p><strong>Frágiles:</strong> {{ currentOrder.hasFragileItems ? 'Sí' : 'No' }}</p>
        </div>
        <div class="detail-card">
          <h3>Fechas</h3>
          <p><strong>Creada:</strong> {{ new Date(currentOrder.createdAt).toLocaleString('es') }}</p>
          <p><strong>Actualizada:</strong> {{ new Date(currentOrder.updatedAt).toLocaleString('es') }}</p>
          <p><strong>Procesada:</strong> {{ currentOrder.processedAt ? new Date(currentOrder.processedAt).toLocaleString('es') : 'Pendiente' }}</p>
        </div>
      </div>

      <div v-if="currentOrder.errorMessage" class="error-detail">
        <h3>⚠️ Error</h3>
        <p>{{ currentOrder.errorMessage }}</p>
      </div>

      <OrderMaterialsList :materials="currentOrder.materials" />
    </div>
  </div>
</template>

<style scoped>
.order-detail { max-width: 900px; margin: 0 auto; }
.back-link { color: #1565c0; text-decoration: none; display: inline-block; margin-bottom: 20px; }
.loading-container { display: flex; justify-content: center; padding: 60px; }
.error-banner { background: #ffebee; color: #c62828; padding: 16px; border-radius: 8px; }
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.detail-header h1 { font-size: 24px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.detail-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.detail-card h3 { margin-bottom: 12px; font-size: 16px; }
.detail-card p { margin: 6px 0; font-size: 14px; color: #555; }
.error-detail { background: #ffebee; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
.error-detail h3 { color: #c62828; margin-bottom: 8px; }
</style>

