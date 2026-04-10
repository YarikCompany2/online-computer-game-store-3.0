import { IsEnum, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";

export class CreateCompanyDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;
}
