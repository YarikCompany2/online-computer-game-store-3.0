import { IsEnum, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";
import { CompanyType } from "../entities/company.entity";


export class CreateCompanyDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUrl()
    logoUrl?: string;

    @IsEnum(CompanyType)
    type: CompanyType;
}
