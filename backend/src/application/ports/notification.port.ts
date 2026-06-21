export interface INotificationPort {
  notifyLowStock(materialId: string, currentStock: number, threshold: number): Promise<void>;
  notifyOrderFailed(orderId: string, reason: string): Promise<void>;
  notifyOrderCompleted(orderId: string): Promise<void>;
}

