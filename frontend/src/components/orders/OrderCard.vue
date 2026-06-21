<script setup lang="ts">
import type { Order } from '../../types'
import StatusBadge from '../common/StatusBadge.vue'

defineProps<{ order: Order }>()
</script>

<template>
  <div class="order-card">
    <div class="order-header">
      <span class="order-id">#{{ order.shopifyOrderId }}</span>
      <StatusBadge :status="order.status" />
    </div>
    <div class="order-body">
      <p><strong>Email:</strong> {{ order.customerEmail ?? 'N/A' }}</p>
      <p><strong>Caja:</strong> {{ order.boxType ?? 'Sin asignar' }}</p>
      <p><strong>Frágiles:</strong> {{ order.hasFragileItems ? 'Sí ⚠️' : 'No' }}</p>
      <p><strong>Total:</strong> ${{ order.totalPrice.toFixed(2) }}</p>
    </div>
    <div class="order-footer">
      <span class="date">{{ new Date(order.createdAt).toLocaleDateString('es') }}</span>
      <router-link :to="`/orders/${order.id}`" class="btn btn-sm">Ver detalle →</router-link>
    </div>
  </div>
</template>

<style scoped>
.order-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s, box-shadow 0.2s; }
.order-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.order-id { font-weight: 700; font-size: 16px; }
.order-body p { margin: 4px 0; font-size: 14px; color: #555; }
.order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
.date { font-size: 12px; color: #999; }
.btn-sm { padding: 4px 12px; font-size: 12px; background: #e3f2fd; color: #1565c0; text-decoration: none; border-radius: 6px; }
</style>

