import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/roles/role.entity';

@Entity('claims')
export class Claim {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'user:create',
    description: 'Unique name of the claim/permission',
  })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    example: 'Allows a user to create other users',
    description: 'A brief description of what this claim allows',
  })
  @Column()
  description: string; // 👈 Mandatory field

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToMany(() => Role, (role) => role.claims)
  roles: Role[];
}

