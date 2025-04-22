import { Test, TestingModule } from '@nestjs/testing';
import { BusinessItemService } from './business-item.service';

describe('BusinessItemService', () => {
  let service: BusinessItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessItemService],
    }).compile();

    service = module.get<BusinessItemService>(BusinessItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
