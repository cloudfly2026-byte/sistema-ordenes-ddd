export class InvalidOrderStateTransitionException extends Error {
  constructor(from: string, to: string) {
    super(`Invalid order state transition from "${from}" to "${to}"`);
    this.name = 'InvalidOrderStateTransitionException';
  }
}

export class OrderAlreadyProcessedException extends Error {
  constructor(orderId: string, status: string) {
    super(`Order ${orderId} is already in terminal state: ${status}`);
    this.name = 'OrderAlreadyProcessedException';
  }
}

export class OrderNotFoundException extends Error {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundException';
  }
}

export class EmptyOrderException extends Error {
  constructor() {
    super('Cannot process an order with 0 products');
    this.name = 'EmptyOrderException';
  }
}

