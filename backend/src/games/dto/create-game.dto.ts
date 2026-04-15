import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from "class-validator";
import { GameStatus } from "../entities/game.entity";
import { Type } from "class-transformer";

export class GameRequirementDto {
    @IsString()
    type: 'minimum' | 'recommended';

    @IsString()
    @IsOptional()
    processor: string;

    @IsString()
    @IsOptional()
    ram: string;

    @IsString()
    @IsOptional()
    gpu: string;

    @IsString()
    @IsOptional()
    storage: string;

    @IsArray()
    @IsInt({ each: true })
    platformIds: number[];
}


export class CreateGameDto {
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    title: string;

    @IsString()
    @MinLength(10)
    @MaxLength(2000)
    description: string;

    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber({}, { message: 'Price must be a valid number' })
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    fileUrl?: string;

    @IsOptional()
    @IsArray()
    requirements?: GameRequirementDto[]; 

    @IsEnum(GameStatus)
    @IsOptional()
    status?: GameStatus;

    @IsArray()
    @IsInt({ each: true })
    categoryIds: number[];

    @IsOptional()
    @IsUUID()
    developerId?: string;

    @IsOptional()
    @IsUUID()
    publisherId?: string;

    @IsOptional()
    @IsString()
    releaseDate?: string;
}
