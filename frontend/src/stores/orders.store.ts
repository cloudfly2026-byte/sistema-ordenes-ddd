import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Order, PaginationParams } from '../types'
import { orderService } from '../services/api.service'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const limit = ref(20)
  const total = ref(0)

  const completedOrders = computed(() => orders.value.filter(o => o.status === 'COMPLETED'))
  const failedOrders = computed(() => orders.value.filter(o => o.status === 'FAILED'))
  const processingOrders = computed(() => orders.value.filter(o => o.status === 'PROCESSING'))

  async function fetchOrders(params?: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      const response = await orderService.getOrders({ page: page.value, limit: limit.value, ...params })
      orders.value = response.data
      total.value = response.total ?? response.data.length
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error fetching orders'
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderById(id: string) {
    loading.value = true
    error.value = null
    try {
      currentOrder.value = await orderService.getOrderById(id)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error fetching order'
    } finally {
      loading.value = false
    }
  }

  return {
    orders, currentOrder, loading, error, page, limit, total,
    completedOrders, failedOrders, processingOrders,
    fetchOrders, fetchOrderById,
  }
})

