import { Injectable, Logger } from '@nestjs/common';
import { ProcessOrderDto } from './process-order.dto';

@Injectable()
export class ProcessOrderUseCase {
  private readonly logger = new Logger(ProcessOrderUseCase.name);

  async execute(dto: ProcessOrderDto): Promise<{ orderId: string; status: string }> {
    this.logger.log(`Processing order: ${dto.orderId}`);
    return { orderId: dto.orderId, status: 'PROCESSING' };
  }
}

