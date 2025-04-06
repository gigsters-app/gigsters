import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/user.entity';
import { Claim } from 'src/claims/claim.entity';

@Entity('roles')
export class Role {
  @ApiProperty({ description: 'Unique identifier', format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Role name', example: 'admin' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    description: 'Optional description for the role',
    example: 'Has full access to manage users and settings',
    required: false,
  })
  @Column({ nullable: true })
  description?: string; // ✅ Optional field

  @ApiProperty({ description: 'Indicates if the role is super admin', example: false })
  @Column({ default: false })
  isSuperAdmin: boolean;

  @ApiProperty({ description: 'Timestamp when role was created' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp when role was last updated' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @ManyToMany(() => Claim, { eager: true })
  @JoinTable({
    name: 'roles_claims',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'claimId', referencedColumnName: 'id' },
  })
  claims: Claim[];
}

