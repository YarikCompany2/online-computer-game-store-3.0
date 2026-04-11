import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Game } from '../../games/entities/game.entity';
import { Company } from '../../companies/entities/company.entity';

export enum NotificationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum NotificationType {
  GAME_PUBLISH = 'game_publish',
  COMPANY_INVITATION = 'company_invitation'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Column({ name: 'game_id', type: 'uuid', nullable: true }) 
  gameId: string | null;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ type: 'text' })
  message: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GAME_PUBLISH
  })
  type: NotificationType;

  @Column({ name: 'sender_company_id', nullable: true })
  senderCompanyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'sender_company_id' })
  senderCompany: Company;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @ManyToOne(() => Game, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'game_id' })
  game: Game | null;
}