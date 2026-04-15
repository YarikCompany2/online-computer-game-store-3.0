import { IsEnum, IsString, IsUUID } from "class-validator";
import { RequirementType } from "../entities/requirement.entity";

export class CreateRequirementDto {
  @IsUUID()
  gameId: string;

  @IsEnum(RequirementType)
  type: RequirementType;

  @IsString() processor: string;
  @IsString() ram: string;
  @IsString() gpu: string;
  @IsString() storage: string;
}
