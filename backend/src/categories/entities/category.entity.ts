import { Game } from "../../games/entities/game.entity";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50, unique: true })
    name: string

    @ManyToMany(() => Game, (game) => game.categories)
    games: Game[];
}
