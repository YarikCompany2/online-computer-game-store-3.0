import { IsOptional, IsUUID } from 'class-validator';

export class ApplyDiscountDto {
  @IsUUID()
  gameId: string;

  @IsOptional()
  @IsUUID()
  discountId: string | null;
}