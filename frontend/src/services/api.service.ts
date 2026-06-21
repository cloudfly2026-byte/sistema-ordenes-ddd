import axios from 'axios'
import type { Order, Material, LowStockAlert, DashboardMetrics, PaginationParams, ApiResponse } from '../types'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const orderService = {
  async getOrders(params?: PaginationParams): Promise<ApiResponse<Order[]>> {
    const { data } = await api.get('/orders', { params })
    return data
  },
  async getOrderById(id: string): Promise<Order> {
    const { data } = await api.get(`/orders/${id}`)
    return data
  },
}

export const inventoryService = {
  async getInventory(): Promise<Material[]> {
    const { data } = await api.get('/inventory')
    return data
  },
  async getLowStock(): Promise<LowStockAlert[]> {
    const { data } = await api.get('/inventory/low-stock')
    return data
  },
  async getMaterialStock(materialId: string): Promise<Material> {
    const { data } = await api.get(`/inventory/${materialId}`)
    return data
  },
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const { data } = await api.get('/dashboard/metrics')
    return data
  },
}

export default api

