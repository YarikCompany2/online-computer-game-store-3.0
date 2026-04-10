import { Game } from "../../games/entities/game.entity";
import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'logo_url', length: 255, nullable: true })
    logoUrl: string;

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @DeleteDateColumn({ name: 'deleted_at', select: false })
    deletedAt: Date;

    @OneToMany(() => Game, (game) => game.developer)
    developedGames: Game[];

    @OneToMany(() => Game, (game) => game.publisher)
    publishedGames: Game[];
}
