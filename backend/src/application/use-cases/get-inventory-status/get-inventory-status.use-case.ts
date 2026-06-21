import { Injectable, Logger } from '@nestjs/common';
import { GetInventoryStatusDto } from './get-inventory-status.dto';

@Injectable()
export class GetInventoryStatusUseCase {
  private readonly logger = new Logger(GetInventoryStatusUseCase.name);

  async execute(dto: GetInventoryStatusDto): Promise<unknown[]> {
    this.logger.log('Fetching inventory status');
    return [];
  }
}

