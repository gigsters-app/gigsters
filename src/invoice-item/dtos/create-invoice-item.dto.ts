import { IsString, IsInt, IsNumber } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString()
  description: string;

  @IsInt()
  quantity: number;

  @IsNumber()
  unitPrice: number;
}
