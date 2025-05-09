import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, ILike } from 'typeorm';
import { CreateUserDto } from './DTOs/create-user.dto';
import { User } from './user.entity';
import { UpdateUserDto } from './DTOs/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/roles/role.entity';
import { RegisterUserDto } from './DTOs/register-user.dto';
import { BusinessProfile } from 'src/business-profile/business-profile.entity';
import { MailService } from 'src/common/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './DTOs/register.dto';
import { getBaseUrl } from 'src/common/utils/app-url.util';
import { PaginationDto, PaginatedResponseDto } from './DTOs/pagination.dto';
import { UserSearchDto } from './DTOs/user-search.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
        private readonly emailService: MailService,
        private readonly jwtService: JwtService
      ) {}

      

  async create(createUserDto: CreateUserDto): Promise<User> {
    const {
      email,
      password: plainPassword,
      firstName,
      lastName,
      isActive,
      roleId: suppliedRoleId,
    } = createUserDto;

    // 1. Prevent duplicate emails (including soft-deleted)
    const existing = await this.entityManager.findOne(User, {
      where: { email },
      withDeleted: true,
    });
    if (existing) {
      throw new ConflictException(`A user with email "${email}" already exists.`);
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3. Create your User instance, now including optional DTO fields
    const user = this.entityManager.create(User, {
      email,
      password: hashedPassword,
      firstName,    // ← if undefined, falls back to NULL
      lastName,     // ← ditto
      isActive,     // ← if undefined, falls back to the column default
    });

    // 4. Decide which roleId to use
    let roleToAssignId = suppliedRoleId;
    if (roleToAssignId) {
      // Validate the client-supplied role exists
      const valid = await this.entityManager.exists(Role, {
        where: { id: roleToAssignId },
      });
      if (!valid) {
        throw new BadRequestException(`Role "${roleToAssignId}" does not exist.`);
      }
    } else {
      // Fetch only the PK for the default “USER” role
      const defaultRole = await this.entityManager.findOne(Role, {
        where: { name: 'USER' },
        select: { id: true },
      });
      if (!defaultRole) {
        throw new InternalServerErrorException('Default "USER" role not found.');
      }
      roleToAssignId = defaultRole.id;
    }

    // 5. Attach exactly one role stub (by id) to the ManyToMany
    user.roles = [{ id: roleToAssignId } as Role];

    // 6. Save User + join-table entry in one go
    return this.entityManager.save(user);
  }
  // 1) Basic user registration
  async registerBasicUser(dto: RegisterDto): Promise<User> {
    const { email, password } = dto;

    // check if email exists, including soft-deleted users
    if (await this.entityManager.findOne(User, { where: { email }, withDeleted: true })) {
      throw new BadRequestException('Email already in use');
    }

    const hashed = await bcrypt.hash(password, 10);

    return this.entityManager.transaction(async (manager) => {
      // load 'user' role
      const userRole = await manager.findOne(Role, { where: { name: 'user' } });
      if (!userRole) throw new NotFoundException('Role "user" not found');

      const user = manager.create(User, {
        email,
        password: hashed,
        roles: [userRole],
      });
      const saved = await manager.save(User, user);

      // generate activation token
      const token = this.jwtService.sign(
        { sub: saved.id, email: saved.email },
        { secret: process.env.ACTIVATION_JWT_SECRET, expiresIn: '24h' }
      );
      const baseUrl = getBaseUrl();
      const link = `${baseUrl}/auth/activate?token=${token}`;
      await this.emailService.sendActivationEmail(saved.email, link);

      return saved;
    });
  }
  async registerUserWithBusinessProfile(dto: RegisterUserDto): Promise<User> {
    const {
      email,
      password,
      firstName,
      lastName,
      mobile,
      phone,
      legalName,
      vatNumber,
      licenseNumber,
      ...profileData
    } = dto;

    // 1. Check if user email exists, including soft-deleted users
    const userExists = await this.entityManager.findOne(User, { where: { email }, withDeleted: true });
    if (userExists) {
      throw new BadRequestException('User email is already in use');
    }

    // 2. Check unique business profile fields
    const conflicts: string[] = [];

    const conflictChecks: [string, any][] = [
   
      ['mobile', mobile],
      ['legalName', legalName],
      ['vatNumber', vatNumber],
    ];

    if (phone) conflictChecks.push(['phone', phone]);
    if (licenseNumber) conflictChecks.push(['licenseNumber', licenseNumber]);

    for (const [field, value] of conflictChecks) {
      const exists = await this.entityManager.findOne(BusinessProfile, {
        where: { [field]: value },
      });

      if (exists) conflicts.push(field);
    }

    if (conflicts.length > 0) {
      throw new BadRequestException(
        `The following business profile fields are already in use: ${conflicts.join(', ')}`
      );
    }

    // 3. Hash password and create records in a transaction
    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.entityManager.transaction(async (manager) => {
      // Load the 'user' role
      const userRole = await manager.findOne(Role, { where: { name: 'user' } });
      if (!userRole) {
        throw new NotFoundException('Default "user" role not found');
      }

      // Create user
      const user = manager.create(User, {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roles: [userRole],
      });

      const savedUser = await manager.save(User, user);

      // Create business profile
      const businessProfile = manager.create(BusinessProfile, {
        ...profileData,
        mobile,
        phone,
        legalName,
        vatNumber,
        licenseNumber,
        user: savedUser,
        userId: savedUser.id,
      });

      await manager.save(BusinessProfile, businessProfile);
      // 🔐 Generate activation token (JWT)
const activationToken = this.jwtService.sign(
  {
    sub: savedUser.id,
    email: savedUser.email,
  },
  {
    secret: process.env.ACTIVATION_JWT_SECRET,
    expiresIn: '24h',
  }
);

// 📧 Send activation email
const baseUrl = getBaseUrl();
const activationLink = `${baseUrl}/auth/activate?token=${activationToken}`;

await this.emailService.sendActivationEmail(savedUser.email, activationLink);

      return savedUser;
    });
  }
    
      async findAll(paginationDto: PaginationDto): Promise<PaginatedResponseDto<User>> {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        const [items, total] = await this.entityManager.findAndCount(User, {
          relations: ['roles', 'roles.claims'],
          skip,
          take: limit,
          order: {
            createdAt: 'DESC' // Order by creation date, newest first
          }
        });

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
          items,
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPreviousPage
        };
      }
    
      async findOneById(id: string): Promise<User> {
        const user = await this.entityManager.findOne(User, {
          where: { id },
          relations: ['roles', 'roles.claims', 'businessProfiles'],
        });
        if (!user) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
      }
    
      async findOneByEmail(email: string): Promise<User | null> {
        // Find user with password and explicitly load roles for auth
        const user = await this.entityManager.findOne(User, {
          where: { email },
          select: ['id', 'email', 'password', 'firstName', 'lastName', 'isActive', 'failedLoginAttempts', 'lastFailedLoginAttempt', 'lastActivationEmailSentAt'],
          relations: ['roles', 'roles.claims', 'businessProfiles'],
        });
        return user;
      }
    
      async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOneById(id);
        
        // Handle password hashing if password is provided in the DTO
        if (updateUserDto.password) {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(updateUserDto.password, saltRounds);
          updateUserDto.password = hashedPassword;
        }
        
        this.entityManager.merge(User, user, updateUserDto);
        return this.entityManager.save(user);
      }
    
      async remove(id: string): Promise<void> {
        await this.entityManager.softDelete(User, id);
      }
    
      async restore(id: string): Promise<void> {
        await this.entityManager.restore(User, id);
      }

      async updatePassword(userId: string, newPassword: string) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
      
        await this.entityManager.update(User, { id: userId }, {
          password: hashedPassword,
          isActive: true,
          failedLoginAttempts: 0,
          lastFailedLoginAttempt: null,
        });
      }
      async save(user: User): Promise<User> {
        return await this.entityManager.save(User, user);
      }
      
      async findMyProfile(userId: string): Promise<Partial<User>> {
        const user = await this.entityManager.findOne(User, {
          where: { id: userId },
        });
        
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
        
        // Create a clean version without sensitive/unnecessary fields
        const { 
          password, 
          lastActivationEmailSentAt, 
          failedLoginAttempts, 
          lastFailedLoginAttempt, 
          deletedAt, 
          roles,
          updatedAt,
          businessProfiles,
          ...cleanUser 
        } = user;
        
        return cleanUser;
      }

      async findAllUsersWithRoleUser(searchDto: UserSearchDto): Promise<PaginatedResponseDto<User>> {
        const { page = 1, limit = 10, email, firstName, lastName, search } = searchDto;
        const skip = (page - 1) * limit;

        // Build the where conditions
        let whereConditions: any = {};
        
        // Add specific field filters if provided
        if (email) {
          whereConditions.email = ILike(`%${email}%`);
        }
        
        if (firstName) {
          whereConditions.firstName = ILike(`%${firstName}%`);
        }
        
        if (lastName) {
          whereConditions.lastName = ILike(`%${lastName}%`);
        }
        
        // Create query builder to join with roles
        const queryBuilder = this.entityManager.createQueryBuilder(User, 'user')
          .leftJoinAndSelect('user.roles', 'role')
          .where('role.name = :roleName', { roleName: 'user' });

        // Add search across multiple fields if provided
        if (search) {
          queryBuilder.andWhere(
            '(user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
            { search: `%${search}%` }
          );
        }
        
        // Add specific field conditions from above
        Object.keys(whereConditions).forEach(key => {
          queryBuilder.andWhere(`user.${key} LIKE :${key}`, { [key]: whereConditions[key] });
        });
        
        // Apply pagination
        queryBuilder
          .skip(skip)
          .take(limit)
          .orderBy('user.createdAt', 'DESC');
        
        // Execute the query
        const [items, total] = await queryBuilder.getManyAndCount();
        
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;
        
        return {
          items,
          total,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPreviousPage
        };
      }
}
