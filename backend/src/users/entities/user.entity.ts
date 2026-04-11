import { Order } from "../../orders/entities/order.entity";
import { Cart } from "../../cart/entities/cart.entity";
import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Library } from "../../library/entities/library.entity";
import { Review } from "../../reviews/entities/review.entity";

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    MODERATOR = 'moderator'
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 255 })
    email: string;

    @Column({ name: 'password_hash', length: 255 })
    passwordHash: string;

    @Column({ length: 50 })
    username: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER
    })
    role: UserRole;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance: number;

    @Column({ name: 'refresh_token_hash', nullable: true, select: false })
    refreshTokenHash: string;

    @Column({ name: 'company_id', type: 'uuid', nullable: true })
    companyId: string | null;

    @Column({ 
      name: 'avatar_url', 
      type: 'varchar', 
      length: 500, 
      nullable: true 
    })
    avatarUrl: string | null;

    @DeleteDateColumn({ name: 'deleted_at', select: false })
    deletedAt: Date;

    @OneToMany(() => Cart, (cart) => cart.user)
    cartItems: Cart[];

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

    @OneToMany(() => Library, (lib) => lib.user)
    libraryItems: Library[];

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];
}
