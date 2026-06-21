export interface IShopifyWebhookPort {
  validateHmac(payload: string, signature: string, secret: string): boolean;
  parseOrder(payload: Record<string, unknown>): {
    shopifyOrderId: string;
    customerEmail: string | null;
    lineItems: Array<{
      productId: string;
      variantId: string;
      sku: string;
      title: string;
      quantity: number;
      isFragile: boolean;
    }>;
  };
}

