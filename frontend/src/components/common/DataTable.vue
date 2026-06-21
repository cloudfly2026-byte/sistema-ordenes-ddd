<script setup lang="ts">
defineProps<{ columns: string[]; data: Record<string, unknown>[]; loading?: boolean }>()
</script>

<template>
  <div class="data-table-wrapper">
    <div v-if="loading" class="table-loading">Cargando datos...</div>
    <div v-else-if="data.length === 0" class="table-empty">No hay datos para mostrar</div>
    <table v-else class="data-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in data" :key="idx">
          <td v-for="col in columns" :key="col">{{ row[col] ?? '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.data-table-wrapper { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
.data-table th { font-weight: 600; color: #666; font-size: 13px; background: #f8f9fa; }
.table-loading, .table-empty { text-align: center; padding: 40px; color: #666; }
</style>

