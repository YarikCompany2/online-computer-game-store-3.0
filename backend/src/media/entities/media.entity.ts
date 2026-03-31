import { Game } from "../../games/entities/game.entity";
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video'
}

@Entity('game_media')
export class Media {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'game_id', type: 'uuid' })
    gameId: string;

    @Column({ name: 'file_url', length: 500 })
    fileUrl: string;

    @Column({
        type: 'enum',
        enum: MediaType,
        default: MediaType.IMAGE
    })
    type: MediaType;

    @Column({ name: 'is_main', default: false })
    isMain: boolean;

    @ManyToOne(() => Game, (game) => game.media)
    @JoinColumn({ name: 'game_id' })
    game: Game;
}
