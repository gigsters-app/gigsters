import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn, 
    DeleteDateColumn, 
    ManyToOne,
    JoinColumn,
    ManyToMany,
    JoinTable,
    OneToMany
  } from 'typeorm';
  import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Role } from 'src/roles/role.entity';
import { BusinessProfile } from 'src/business-profile/business-profile.entity';
  
  @Entity('users')
  export class User {
    @ApiProperty({
      description: 'Unique identifier for the user',
      type: String,
      format: 'uuid',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ApiProperty({
      description: 'Email address of the user, must be unique',
      example: 'user@example.com',
    })
    @Column({ unique: true })
    email: string;
  
    @ApiHideProperty()
    @Column({ select: false })
    password: string;
  
    @ApiProperty({
      description: 'First name of the user',
      example: 'John',
      required: false,
      nullable: true,
    })
    @Column({ nullable: true })
    firstName?: string;
  
    @ApiProperty({
      description: 'Last name of the user',
      example: 'Doe',
      required: false,
      nullable: true,
    })
    @Column({ nullable: true })
    lastName?: string;
  
    @ApiProperty({
      description: 'Indicates if the user account is active',
      default: true,
    })
    @Column({ default: true })
    isActive: boolean;
  
    @ApiProperty({
      description: 'Timestamp when the user was created',
      type: String,
      format: 'date-time',
    })
    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;
  
    @ApiProperty({
      description: 'Timestamp when the user was last updated',
      type: String,
      format: 'date-time',
    })
    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;
  
    @ApiProperty({
      description: 'Timestamp marking when the user was soft deleted',
      type: String,
      format: 'date-time',
      nullable: true,
      required: false,
    })
    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt?: Date;

    @ManyToMany(() => Role, { eager: true })
    @JoinTable({ name: 'users_roles' })
    roles: Role[];

    @OneToMany(() => BusinessProfile, (profile) => profile.user)
    businessProfiles: BusinessProfile[];
  }
  