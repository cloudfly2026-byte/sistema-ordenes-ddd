export class ShopifyWebhookDto {
  id: string;
  order_number: string;
  email?: string;
  total_price?: string;
  line_items: ShopifyLineItemDto[];
  created_at: string;
}

export class ShopifyLineItemDto {
  id: string;
  product_id: string;
  variant_id: string;
  sku: string;
  title: string;
  quantity: number;
  properties?: Array<{ name: string; value: string }>;
}

