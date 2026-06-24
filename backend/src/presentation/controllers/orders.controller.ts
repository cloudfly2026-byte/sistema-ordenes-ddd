import { Controller, Get, Param, Query, Logger, Post, Inject } from '@nestjs/common';
import { IOrderRepository } from '../../domain/order/repositories/order.repository.interface';
import { ProcessOrderUseCase } from '../../application/use-cases/process-order/process-order.use-case';
import { Order } from '../../domain/order/entities/order.entity';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly processOrderUseCase: ProcessOrderUseCase,
  ) {}

  @Get()
  async getOrders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    const offset = (Number(page) - 1) * Number(limit);
    const orders = await this.orderRepository.findRecent(Number(limit), offset, status);
    const total = await this.orderRepository.countByStatus(status);

    return { data: orders.map((order) => this.toOrderResponse(order)), page: Number(page), limit: Number(limit), total };
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    const order = await this.orderRepository.findById(id);
    return order ? this.toOrderResponse(order) : null;
  }

  @Post(':id/process')
  async processOrder(@Param('id') id: string) {
    return this.processOrderUseCase.execute(id);
  }

  private toOrderResponse(order: Order) {
    return {
      id: order.id,
      shopifyOrderId: order.shopifyOrderId,
      status: order.status.value,
      customerEmail: order.customerEmail,
      totalPrice: order.totalPrice.amount,
      hasFragileItems: order.hasFragileItems,
      boxType: order.boxType?.value ?? null,
      errorMessage: order.errorMessage,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      processedAt: order.processedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.shopifyLineItemId ?? item.id,
        variantId: null,
        sku: item.sku ?? '',
        title: item.productName,
        quantity: item.quantity,
        isFragile: item.isFragile,
        unitPrice: item.price.amount,
      })),
      materials: [],
    };
  }
}
