import { Game } from "../../games/entities/game.entity";
import { User } from "../../users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('cart')
export class Cart {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid'})
    userId: string;

    @Column({ name: 'game_id', type: 'uuid' })
    gameId: string;

    @CreateDateColumn({ name: 'added_at' })
    addedAt: Date;

    @ManyToOne(() => User, (user) => user.cartItems)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Game, (game) => game.cartItems)
    @JoinColumn({ name: 'game_id' })
    game: Game;
}

