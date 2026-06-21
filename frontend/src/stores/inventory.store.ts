import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Material, LowStockAlert } from '../types'
import { inventoryService } from '../services/api.service'

export const useInventoryStore = defineStore('inventory', () => {
  const materials = ref<Material[]>([])
  const lowStockAlerts = ref<LowStockAlert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const lowStockMaterials = computed(() =>
    materials.value.filter(m => m.currentStock < m.lowStockThreshold)
  )

  const totalMaterials = computed(() => materials.value.length)

  async function fetchInventory() {
    loading.value = true
    error.value = null
    try {
      materials.value = await inventoryService.getInventory()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error fetching inventory'
    } finally {
      loading.value = false
    }
  }

  async function fetchLowStock() {
    loading.value = true
    error.value = null
    try {
      lowStockAlerts.value = await inventoryService.getLowStock()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error fetching low stock'
    } finally {
      loading.value = false
    }
  }

  return {
    materials, lowStockAlerts, loading, error,
    lowStockMaterials, totalMaterials,
    fetchInventory, fetchLowStock,
  }
})

