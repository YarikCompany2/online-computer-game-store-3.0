import { IsBoolean, IsEnum, IsOptional, IsUrl, IsUUID } from "class-validator";
import { MediaType } from "../entities/media.entity";

export class CreateMediaDto {
  @IsUUID()
  gameId: string;

  @IsUrl()
  fileUrl: string;

  @IsEnum(MediaType)
  type: MediaType;

  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}
