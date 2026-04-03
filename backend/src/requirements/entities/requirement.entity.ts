import { Platform } from "../../platform/entities/platform.entity";
import { Game } from "../../games/entities/game.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum RequirementType {
  MINIMUM = 'minimum',
  RECOMMENDED = 'recommended',
}

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'game_id', type: 'uuid' })
  gameId: string;

  @Column({
    type: 'enum',
    enum: RequirementType,
    default: RequirementType.MINIMUM
  })
  type: RequirementType;

  @Column({ length: 255 })
  os: string;

  @Column({ length: 255 })
  processor: string;

  @Column({ length: 255 })
  ram: string;

  @Column({ length: 255 })
  gpu: string;

  @Column({ length: 255 })
  storage: string;

  @ManyToOne(() => Game, (game) => game.requirements)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToMany(() => Platform, (platform) => platform.requirements)
  @JoinTable({ name: 'requirement_platforms' })
  platforms: Platform[];
}
