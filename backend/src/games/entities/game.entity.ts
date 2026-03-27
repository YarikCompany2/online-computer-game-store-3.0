import { Category } from "../../categories/entities/category.entity";
import { Company } from "../../companies/entities/company.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum GameStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    COMING_SOON = 'coming_soon'
}

@Entity('games')
export class Game {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({ name: 'file_url', length: 500, nullable: true })
    fileUrl: string;

    @Column({
        type: 'enum',
        enum: GameStatus,
        default: GameStatus.ACTIVE
    })
    status: GameStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @DeleteDateColumn({ name: 'deleted_at', select: false })
    deletedAt: Date;

    @Column({ name: 'company_id', type: 'uuid' })
    companyId: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @ManyToMany(() => Category, (category) => category.games)
    @JoinTable({
        name: 'game_categories',
        joinColumn: { name: 'game_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
    })
    categories: Category[];
}
