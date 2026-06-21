import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const routes = [
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/orders', name: 'orders', component: () => import('../views/OrdersView.vue') },
  { path: '/orders/:id', name: 'order-detail', component: () => import('../views/OrderDetailView.vue') },
  { path: '/inventory', name: 'inventory', component: () => import('../views/InventoryView.vue') },
  { path: '/low-stock', name: 'low-stock', component: () => import('../views/LowStockView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

