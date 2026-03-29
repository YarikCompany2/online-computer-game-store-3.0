import { IsString, IsInt, Min, Max, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  @Max(99)
  discountPercent: number;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}