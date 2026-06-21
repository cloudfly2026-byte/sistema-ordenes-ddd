<script setup lang="ts">
import { onMounted } from 'vue'
import { useInventory } from '../composables/useInventory'
import InventoryTable from '../components/inventory/InventoryTable.vue'
import LoadingSpinner from '../components/common/LoadingSpinner.vue'

const { materials, loading, error, fetchInventory } = useInventory()

onMounted(() => fetchInventory())
</script>

<template>
  <div class="inventory-page">
    <div class="page-header">
      <h1 class="page-title">📊 Inventario</h1>
      <button @click="fetchInventory()" class="btn btn-primary">🔄 Actualizar</button>
    </div>

    <div v-if="loading" class="loading-container"><LoadingSpinner /></div>
    <div v-else-if="error" class="error-banner">{{ error }}</div>
    <div v-else-if="materials.length === 0" class="empty-state">No hay materiales en el inventario</div>

    <InventoryTable v-else :materials="materials" />
  </div>
</template>

<style scoped>
.inventory-page { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 28px; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; }
.btn-primary { background: #1565c0; color: white; }
.loading-container { display: flex; justify-content: center; padding: 60px; }
.error-banner { background: #ffebee; color: #c62828; padding: 16px; border-radius: 8px; }
.empty-state { text-align: center; padding: 60px; color: #666; }
</style>

