import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { ProcessOrderUseCase } from '../../application/use-cases/process-order/process-order.use-case';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(
    private readonly processOrderUseCase: ProcessOrderUseCase,
  ) {}

  @Get()
  async getOrders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    this.logger.log(`Fetching orders page=${page} limit=${limit} status=${status}`);
    return { data: [], page: Number(page), limit: Number(limit) };
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    this.logger.log(`Fetching order ${id}`);
    return { id, status: 'PROCESSING' };
  }
}

