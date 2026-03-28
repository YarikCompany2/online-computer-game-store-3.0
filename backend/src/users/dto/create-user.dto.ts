import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(3)
    @MaxLength(50)
    username: string;

    @IsString()
    @MinLength(8)
    password: string;
}
