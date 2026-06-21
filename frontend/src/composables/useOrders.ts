import { onMounted } from 'vue'
import { useOrdersStore } from '../stores/orders.store'
import { storeToRefs } from 'pinia'

export function useOrders() {
  const store = useOrdersStore()
  const { orders, currentOrder, loading, error, page, limit, total, completedOrders, failedOrders, processingOrders } = storeToRefs(store)

  onMounted(() => {
    if (orders.value.length === 0) {
      store.fetchOrders()
    }
  })

  return {
    orders, currentOrder, loading, error, page, limit, total,
    completedOrders, failedOrders, processingOrders,
    fetchOrders: store.fetchOrders,
    fetchOrderById: store.fetchOrderById,
  }
}

