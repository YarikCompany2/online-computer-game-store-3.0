import { IsUUID } from "class-validator";

export class AddToCartDto {
    @IsUUID()
    gameId: string;
}
