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

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'varchar', name: 'file_url', length: 500, nullable: true })
    fileUrl: string | null;

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

    @OneToMany(() => Cart, (cart) => cart.game)
    cartItems: Cart[];

    @OneToMany(() => Media, (media) => media.game, { cascade: true })
    media: Media[];

    @OneToMany(() => Requirement, (req) => req.game, { cascade: true })
    requirements: Requirement[];

    @OneToMany(() => Review, (review) => review.game)
    reviews: Review[];

    @Column({ name: 'promotion_id', type: 'uuid', nullable: true })
    promotionId: string | null;

    @ManyToOne(() => Discount, (discount) => discount.games)
    @JoinColumn({ name: 'promotion_id' })
    discount: Discount;
}
