import { Test, TestingModule } from '@nestjs/testing';
import { QuotationItemController } from './quotation-item.controller';

describe('QuotationItemController', () => {
  let controller: QuotationItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuotationItemController],
    }).compile();

    controller = module.get<QuotationItemController>(QuotationItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
