import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { GameStatus } from "../entities/game.entity";

export class CreateGameDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    fileUrl?: string;

    @IsEnum(GameStatus)
    @IsOptional()
    status?: GameStatus;

    @IsArray()
    @IsInt({ each: true })
    categoryIds: number[];
}
