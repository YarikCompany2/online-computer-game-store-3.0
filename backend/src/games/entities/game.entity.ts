import { Media } from "../../media/entities/media.entity";
import { Cart } from "../../cart/entities/cart.entity";
import { Category } from "../../categories/entities/category.entity";
import { Company } from "../../companies/entities/company.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Requirement } from "../../requirements/entities/requirement.entity";
import { Review } from "../../reviews/entities/review.entity";
import { Discount } from "../../discounts/entities/discount.entity";

export enum GameStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    COMING_SOON = 'coming_soon'
}

@Entity('games')
export class Game {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255, unique: true })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'varchar', name: 'file_url', length: 500, nullable: true })
    fileUrl: string | null;

    @Column({ name: 'build_url', nullable: true, select: false })
    buildUrl: string;

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

    @Column({ name: 'developer_id', type: 'uuid' })
    developerId: string;

    @ManyToOne(() => Company, (company) => company.developedGames)
    @JoinColumn({ name: 'developer_id' })
    developer: Company;

    @Column({ name: 'publisher_id', type: 'uuid' })
    publisherId: string;

    @ManyToOne(() => Company, (company) => company.publishedGames)
    @JoinColumn({ name: 'publisher_id' })
    publisher: Company;

    @ManyToMany(() => Category, (category) => category.games)
    @JoinTable({
        name: 'game_categories',
        joinColumn: { name: 'game_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
    })
    categories: Category[];

    @OneToMany(() => Cart, (cart) => cart.game)
    cartItems: Cart[];

    @OneToMany(() => Media, (media) => media.game, { cascade: true, onDelete: 'CASCADE' })
    media: Media[];

    @OneToMany(() => Requirement, (req) => req.game, { cascade: true, onDelete: 'CASCADE' })
    requirements: Requirement[];

    @OneToMany(() => Review, (review) => review.game)
    reviews: Review[];

    @Column({ name: 'promotion_id', type: 'uuid', nullable: true })
    promotionId: string | null;

    @ManyToOne(() => Discount, (discount) => discount.games)
    @JoinColumn({ name: 'promotion_id' })
    discount: Discount | null;
}
