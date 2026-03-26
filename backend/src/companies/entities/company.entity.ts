import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum CompanyType {
    PUBLISHER = 'publisher',
    DEVELOPER = 'developer',
    BOTH = 'both'
}

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

    @Column({
        type: 'enum',
        enum: CompanyType,
        default: CompanyType.DEVELOPER
    })
    type: CompanyType;

    @Column({ name: 'is_verified', default: false })
    isVerified: boolean;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @DeleteDateColumn({ name: 'deleted_at', select: false })
    deletedAt: Date;
}
