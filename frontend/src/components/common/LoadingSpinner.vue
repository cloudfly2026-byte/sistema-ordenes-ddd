<template>
  <div class="spinner-container">
    <div class="spinner"></div>
    <span class="spinner-text">Cargando...</span>
  </div>
</template>

<style scoped>
.spinner-container { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.spinner { width: 40px; height: 40px; border: 4px solid #e3f2fd; border-top-color: #1565c0; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner-text { color: #666; font-size: 14px; }
</style>

