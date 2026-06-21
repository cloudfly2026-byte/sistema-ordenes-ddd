export interface Order {
  id: string
  shopifyOrderId: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  customerEmail: string | null
  totalPrice: number
  hasFragileItems: boolean
  boxType: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  processedAt: string | null
  items: OrderItem[]
  materials: OrderMaterial[]
}

export interface OrderItem {
  id: string
  productId: string
  variantId: string | null
  sku: string
  title: string
  quantity: number
  isFragile: boolean
  unitPrice: number
}

export interface OrderMaterial {
  id: string
  materialId: string
  quantity: number
  materialType: string
}

export interface Material {
  id: string
  sku: string
  name: string
  type: string
  description: string | null
  currentStock: number
  reservedStock: number
  lowStockThreshold: number
  isActive: boolean
}

export interface LowStockAlert {
  materialId: string
  materialName: string
  currentStock: number
  threshold: number
}

export interface DashboardMetrics {
  totalOrders: number
  completedOrders: number
  failedOrders: number
  processingOrders: number
  avgProcessingTime: number
  successRate: number
}

export interface PaginationParams {
  page: number
  limit: number
  status?: string
}

export interface ApiResponse<T> {
  data: T
  page?: number
  limit?: number
  total?: number
}

