import axios from 'axios'
import type { Order, Material, LowStockAlert, PaginationParams, ApiResponse } from '../types'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const orderService = {
  async getOrders(params?: PaginationParams): Promise<ApiResponse<Order[]>> {
    const { data } = await api.get('/orders', { params })
    const orders = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return {
      data: orders.map(normalizeOrder),
      page: data?.page,
      limit: data?.limit,
      total: data?.total ?? orders.length,
    }
  },
  async getOrderById(id: string): Promise<Order> {
    const { data } = await api.get(`/orders/${id}`)
    return normalizeOrder(data?.data ?? data)
  },
}

function normalizeOrder(raw: any): Order {
  const items = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?._items) ? raw._items : []
  const materials = Array.isArray(raw?.materials) ? raw.materials : Array.isArray(raw?._materials) ? raw._materials : []

  return {
    id: raw?.id ?? raw?._id ?? '',
    shopifyOrderId: raw?.shopifyOrderId ?? raw?._shopifyOrderId ?? '',
    status: raw?.status ?? raw?._status?._value ?? 'PENDING',
    customerEmail: raw?.customerEmail ?? raw?._customerEmail ?? null,
    totalPrice: Number(raw?.totalPrice ?? raw?._totalPrice?._amount ?? 0),
    hasFragileItems: Boolean(raw?.hasFragileItems ?? raw?._hasFragileItems ?? false),
    boxType: raw?.boxType ?? raw?._boxType?._value ?? null,
    errorMessage: raw?.errorMessage ?? raw?._errorMessage ?? null,
    createdAt: raw?.createdAt ?? raw?._createdAt ?? new Date().toISOString(),
    updatedAt: raw?.updatedAt ?? raw?._updatedAt ?? new Date().toISOString(),
    processedAt: raw?.processedAt ?? raw?._processedAt ?? null,
    items: items.map((item: any) => ({
      id: item?.id ?? item?._id ?? '',
      productId: item?.productId ?? item?._shopifyLineItemId ?? '',
      variantId: item?.variantId ?? null,
      sku: item?.sku ?? item?._sku ?? '',
      title: item?.title ?? item?.productName ?? item?._productName ?? '',
      quantity: Number(item?.quantity ?? item?._quantity ?? 0),
      isFragile: Boolean(item?.isFragile ?? item?._isFragile ?? false),
      unitPrice: Number(item?.unitPrice ?? item?.price ?? item?._price?._amount ?? 0),
    })),
    materials: materials.map((material: any) => ({
      id: material?.id ?? material?._id ?? '',
      materialId: material?.materialId ?? material?._materialId ?? '',
      quantity: Number(material?.quantity ?? material?._quantity ?? 0),
      materialType: material?.materialType ?? material?._materialType ?? 'Material',
    })),
  }
}

export const inventoryService = {
  async getInventory(): Promise<Material[]> {
    const { data } = await api.get('/inventory')
    const materials = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return materials.map(normalizeMaterial)
  },
  async getLowStock(): Promise<LowStockAlert[]> {
    const { data } = await api.get('/inventory/low-stock')
    const alerts = Array.isArray(data?.alerts) ? data.alerts : Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    return alerts.map(normalizeLowStockAlert)
  },
  async getMaterialStock(materialId: string): Promise<Material> {
    const { data } = await api.get(`/inventory/${materialId}`)
    return normalizeMaterial(data?.data ?? data)
  },
}

function normalizeMaterial(raw: any): Material {
  const currentStock = Number(raw?.currentStock ?? 0)
  const reservedStock = Number(raw?.reservedStock ?? 0)

  return {
    id: raw?.id ?? raw?.materialId ?? raw?.code ?? '',
    sku: raw?.sku ?? raw?.code ?? '',
    name: raw?.name ?? raw?.materialName ?? raw?.code ?? 'Material',
    type: raw?.type ?? raw?.materialType ?? 'GENERAL',
    description: raw?.description ?? null,
    currentStock,
    reservedStock,
    lowStockThreshold: Number(raw?.lowStockThreshold ?? raw?.threshold ?? 0),
    isActive: Boolean(raw?.isActive ?? true),
  }
}

function normalizeLowStockAlert(raw: any): LowStockAlert {
  return {
    materialId: raw?.materialId ?? raw?.id ?? raw?.code ?? raw?.material ?? '',
    materialName: raw?.materialName ?? raw?.name ?? raw?.code ?? raw?.material ?? 'Material',
    currentStock: Number(raw?.currentStock ?? 0),
    threshold: Number(raw?.threshold ?? raw?.lowStockThreshold ?? 0),
  }
}

export default api
