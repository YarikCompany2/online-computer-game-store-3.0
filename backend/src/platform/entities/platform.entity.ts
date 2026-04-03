import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Requirement } from "../../requirements/entities/requirement.entity";

@Entity('platforms')
export class Platform {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Requirement, (req) => req.platforms)
  requirements: Requirement[];
}