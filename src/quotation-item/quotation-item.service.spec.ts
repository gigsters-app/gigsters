import { Test, TestingModule } from '@nestjs/testing';
import { QuotationItemService } from './quotation-item.service';

describe('QuotationItemService', () => {
  let service: QuotationItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuotationItemService],
    }).compile();

    service = module.get<QuotationItemService>(QuotationItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
