import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Game } from '../../games/entities/game.entity';

@Entity('discounts')
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'discount_percent', type: 'int' })
  discountPercent: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Game, (game) => game.discount)
  games: Game[];
}