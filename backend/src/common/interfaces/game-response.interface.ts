import { Game } from "../../games/entities/game.entity";

export interface GameWithOwnership extends Game {
    isOwned: boolean;
}