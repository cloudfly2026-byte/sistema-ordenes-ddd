export class OrderResponseDto {
  id: string;
  shopifyOrderId: string;
  status: string;
  customerEmail: string | null;
  totalPrice: number;
  hasFragileItems: boolean;
  boxType: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
}

