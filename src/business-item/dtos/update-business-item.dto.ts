// src/business-item/dto/update-business-item.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateBusinessItemDto } from './create-business-item.dto';

export class UpdateBusinessItemDto extends PartialType(CreateBusinessItemDto) {}

