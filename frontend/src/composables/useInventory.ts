import { onMounted } from 'vue'
import { useInventoryStore } from '../stores/inventory.store'
import { storeToRefs } from 'pinia'

export function useInventory() {
  const store = useInventoryStore()
  const { materials, lowStockAlerts, loading, error, lowStockMaterials, totalMaterials } = storeToRefs(store)

  onMounted(() => {
    if (materials.value.length === 0) {
      store.fetchInventory()
      store.fetchLowStock()
    }
  })

  return {
    materials, lowStockAlerts, loading, error,
    lowStockMaterials, totalMaterials,
    fetchInventory: store.fetchInventory,
    fetchLowStock: store.fetchLowStock,
  }
}

