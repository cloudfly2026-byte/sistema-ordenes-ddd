import { OrderStatus, OrderStatusEnum } from '../value-objects/order-status.vo';
import { BoxType } from '../value-objects/box-type.vo';
import { Money } from '../value-objects/money.vo';
import { OrderItem } from './order-item.entity';
import { OrderReceivedEvent } from '../events/order-received.event';
import { OrderCompletedEvent } from '../events/order-completed.event';
import { OrderFailedEvent } from '../events/order-failed.event';
import {
  InvalidOrderStateTransitionException,
  OrderAlreadyProcessedException,
} from '../exceptions/order.exceptions';

export interface OrderProps {
  id: string;
  shopifyOrderId: string;
  status: OrderStatus;
  customerEmail: string | null;
  totalPrice: Money;
  items: OrderItem[];
  hasFragileItems: boolean;
  boxType: BoxType | null;
  errorMessage: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
}

export class Order {
  private _id: string;
  private _shopifyOrderId: string;
  private _status: OrderStatus;
  private _customerEmail: string | null;
  private _totalPrice: Money;
  private _items: OrderItem[];
  private _hasFragileItems: boolean;
  private _boxType: BoxType | null;
  private _errorMessage: string | null;
  private _idempotencyKey: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _processedAt: Date | null;
  private _domainEvents: Array<OrderReceivedEvent | OrderCompletedEvent | OrderFailedEvent> = [];

  private constructor(props: OrderProps) {
    this._id = props.id;
    this._shopifyOrderId = props.shopifyOrderId;
    this._status = props.status;
    this._customerEmail = props.customerEmail;
    this._totalPrice = props.totalPrice;
    this._items = props.items;
    this._hasFragileItems = props.hasFragileItems;
    this._boxType = props.boxType;
    this._errorMessage = props.errorMessage;
    this._idempotencyKey = props.idempotencyKey;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._processedAt = props.processedAt;
  }

  static create(props: Omit<OrderProps, 'id' | 'status' | 'boxType' | 'errorMessage' | 'processedAt' | 'createdAt' | 'updatedAt'> & { id?: string }): Order {
    const now = new Date();
    const order = new Order({
      ...props,
      id: props.id ?? crypto.randomUUID(),
      status: OrderStatus.pending(),
      boxType: null,
      errorMessage: null,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    order.addDomainEvent(
      new OrderReceivedEvent({
        orderId: order._id,
        shopifyOrderId: order._shopifyOrderId,
        totalItems: order.totalProductCount,
        hasFragileItems: order._hasFragileItems,
        occurredAt: now,
      }),
    );

    return order;
  }

  // ── State Transitions ──

  startProcessing(): void {
    if (!this._status.isPending()) {
      throw new InvalidOrderStateTransitionException(this._status.value, OrderStatusEnum.PROCESSING);
    }
    this._status = OrderStatus.processing();
    this._updatedAt = new Date();
  }

  complete(boxType: BoxType): void {
    if (!this._status.isProcessing()) {
      throw new InvalidOrderStateTransitionException(this._status.value, OrderStatusEnum.COMPLETED);
    }
    this._status = OrderStatus.completed();
    this._boxType = boxType;
    this._processedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new OrderCompletedEvent({
        orderId: this._id,
        shopifyOrderId: this._shopifyOrderId,
        boxType: boxType.value,
        totalItems: this.totalProductCount,
        hasFragileItems: this._hasFragileItems,
        occurredAt: this._processedAt,
      }),
    );
  }

  fail(reason: string): void {
    if (this.isInTerminalState()) {
      throw new OrderAlreadyProcessedException(this._id, this._status.value);
    }
    this._status = OrderStatus.failed();
    this._errorMessage = reason;
    this._processedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new OrderFailedEvent({
        orderId: this._id,
        shopifyOrderId: this._shopifyOrderId,
        reason,
        occurredAt: this._processedAt,
      }),
    );
  }

  // ── Queries ──

  isInTerminalState(): boolean {
    return this._status.isCompleted() || this._status.isFailed() || this._status.isCancelled();
  }

  canBeProcessed(): boolean {
    return this._status.isPending() || this._status.isProcessing();
  }

  get totalProductCount(): number {
    return this._items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // ── Domain Events ──

  addDomainEvent(event: OrderReceivedEvent | OrderCompletedEvent | OrderFailedEvent): void {
    this._domainEvents.push(event);
  }

  pullDomainEvents(): Array<OrderReceivedEvent | OrderCompletedEvent | OrderFailedEvent> {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // ── Getters ──

  get id(): string { return this._id; }
  get shopifyOrderId(): string { return this._shopifyOrderId; }
  get status(): OrderStatus { return this._status; }
  get customerEmail(): string | null { return this._customerEmail; }
  get totalPrice(): Money { return this._totalPrice; }
  get items(): ReadonlyArray<OrderItem> { return this._items; }
  get hasFragileItems(): boolean { return this._hasFragileItems; }
  get boxType(): BoxType | null { return this._boxType; }
  get errorMessage(): string | null { return this._errorMessage; }
  get idempotencyKey(): string | null { return this._idempotencyKey; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get processedAt(): Date | null { return this._processedAt; }
}
