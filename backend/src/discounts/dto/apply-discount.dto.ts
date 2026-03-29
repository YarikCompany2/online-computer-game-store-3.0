import { IsUUID } from 'class-validator';

export class ApplyDiscountDto {
  @IsUUID()
  gameId: string;

  @IsUUID()
  discountId: string;
}