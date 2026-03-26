import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

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

    @Column({ length: 20 })
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

    @DeleteDateColumn({ name: 'deleted_at', select: false })
    deletedAt: Date;
}
