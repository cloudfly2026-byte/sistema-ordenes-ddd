export enum OrderStatusEnum {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export const TERMINAL_STATES: ReadonlySet<OrderStatusEnum> = new Set([
  OrderStatusEnum.COMPLETED,
  OrderStatusEnum.FAILED,
  OrderStatusEnum.CANCELLED,
]);

export const VALID_TRANSITIONS: ReadonlyMap<OrderStatusEnum, ReadonlySet<OrderStatusEnum>> =
  new Map([
    [OrderStatusEnum.PENDING, new Set([OrderStatusEnum.PROCESSING, OrderStatusEnum.CANCELLED])],
    [OrderStatusEnum.PROCESSING, new Set([OrderStatusEnum.COMPLETED, OrderStatusEnum.FAILED])],
    [OrderStatusEnum.COMPLETED, new Set()],
    [OrderStatusEnum.FAILED, new Set()],
    [OrderStatusEnum.CANCELLED, new Set()],
  ]);

export class OrderStatus {
  private readonly _value: OrderStatusEnum;

  constructor(value: OrderStatusEnum | string) {
    const parsed = Object.values(OrderStatusEnum).find((s) => s === value);
    if (!parsed) {
      throw new Error(`Invalid order status: ${value}`);
    }
    this._value = parsed;
  }

  // ── Static Factory Methods ──

  static pending(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PENDING);
  }

  static processing(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PROCESSING);
  }

  static completed(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.COMPLETED);
  }

  static failed(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.FAILED);
  }

  static cancelled(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CANCELLED);
  }

  // ── Instance Query Methods ──

  isPending(): boolean {
    return this._value === OrderStatusEnum.PENDING;
  }

  isProcessing(): boolean {
    return this._value === OrderStatusEnum.PROCESSING;
  }

  isCompleted(): boolean {
    return this._value === OrderStatusEnum.COMPLETED;
  }

  isFailed(): boolean {
    return this._value === OrderStatusEnum.FAILED;
  }

  isCancelled(): boolean {
    return this._value === OrderStatusEnum.CANCELLED;
  }

  get value(): OrderStatusEnum {
    return this._value;
  }

  isTerminal(): boolean {
    return TERMINAL_STATES.has(this._value);
  }

  canTransitionTo(target: OrderStatus): boolean {
    const allowed = VALID_TRANSITIONS.get(this._value);
    if (!allowed) return false;
    return allowed.has(target._value);
  }

  equals(other: OrderStatus): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}