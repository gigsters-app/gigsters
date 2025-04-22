import { Test, TestingModule } from '@nestjs/testing';
import { BusinessItemController } from './business-item.controller';

describe('BusinessItemController', () => {
  let controller: BusinessItemController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessItemController],
    }).compile();

    controller = module.get<BusinessItemController>(BusinessItemController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
