import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    identifier: string;

    @IsString()
    @MinLength(8)
    password: string;
}