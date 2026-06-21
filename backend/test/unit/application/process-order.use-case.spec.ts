import { ProcessOrderUseCase } from '../../../src/application/use-cases/process-order/process-order.use-case';

describe('ProcessOrderUseCase', () => {
  let useCase: ProcessOrderUseCase;

  beforeEach(() => {
    useCase = new ProcessOrderUseCase();
  });

  it('should process an order and return status', async () => {
    const result = await useCase.execute({ orderId: 'test-123' });
    expect(result.orderId).toBe('test-123');
    expect(result.status).toBe('PROCESSING');
  });
});

