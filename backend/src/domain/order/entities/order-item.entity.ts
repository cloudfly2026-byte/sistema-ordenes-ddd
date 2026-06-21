import { Money } from '../value-objects/money.vo';

export interface OrderItemProps {
  id: string;
  orderId: string;
  shopifyLineItemId: string | null;
  productName: string;
  quantity: number;
  price: Money;
  isFragile: boolean;
  sku: string | null;
  createdAt: Date;
}

export class OrderItem {
  private _id: string;
  private _orderId: string;
  private _shopifyLineItemId: string | null;
  private _productName: string;
  private _quantity: number;
  private _price: Money;
  private _isFragile: boolean;
  private _sku: string | null;
  private _createdAt: Date;

  private constructor(props: OrderItemProps) {
    if (props.quantity <= 0) {
      throw new Error('Order item quantity must be positive');
    }
    this._id = props.id;
    this._orderId = props.orderId;
    this._shopifyLineItemId = props.shopifyLineItemId;
    this._productName = props.productName;
    this._quantity = props.quantity;
    this._price = props.price;
    this._isFragile = props.isFragile;
    this._sku = props.sku;
    this._createdAt = props.createdAt;
  }

  static create(props: Omit<OrderItemProps, 'id' | 'createdAt'> & { id?: string }): OrderItem {
    return new OrderItem({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  get id(): string { return this._id; }
  get orderId(): string { return this._orderId; }
  get shopifyLineItemId(): string | null { return this._shopifyLineItemId; }
  get productName(): string { return this._productName; }
  get quantity(): number { return this._quantity; }
  get price(): Money { return this._price; }
  get isFragile(): boolean { return this._isFragile; }
  get sku(): string | null { return this._sku; }
  get createdAt(): Date { return this._createdAt; }

  get totalPrice(): Money {
    return this._price.multiply(this._quantity);
  }
}
