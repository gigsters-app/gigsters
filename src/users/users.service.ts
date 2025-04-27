import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
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

@Injectable()
export class UsersService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
        private readonly emailService: MailService,
        private readonly jwtService: JwtService
      ) {}

      

     async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.entityManager.findOne(User, {
      where: { email: createUserDto.email },
      withDeleted: true, // Checks even soft-deleted users
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${createUserDto.email} already exists.`);
    }

     // Hash and salt password
     const saltRounds = 10;
     const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);
     
     // Replace plaintext password with hashed password
     const userToCreate = {
       ...createUserDto,
       password: hashedPassword,
     };
     const user = this.entityManager.create(User, userToCreate);
 // 4. Fetch the "USER" role from the database
 const defaultRole = await this.entityManager.findOne(Role, {
  where: { name: 'USER' },
});
if (!defaultRole) {
  throw new InternalServerErrorException('Default "USER" role not found.');
}

// 5. Assign the user to the USER role
//    (Since it's a ManyToMany, roles is an array)
    user.roles = [defaultRole];
     
    return this.entityManager.save(user);
  }
  // 1) Basic user registration
  async registerBasicUser(dto: RegisterDto): Promise<User> {
    const { email, password } = dto;

    // check if email exists
    if (await this.entityManager.findOne(User, { where: { email } })) {
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

    // 1. Check if user email exists
    const userExists = await this.entityManager.findOne(User, { where: { email } });
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
    
      async findAll(): Promise<User[]> {
        return this.entityManager.find(User);
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
          relations: ['businessProfiles'],
        });
        
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
        
        // Create a clean version without sensitive/unnecessary fields
        const { 
          password, 
          isActive, 
          lastActivationEmailSentAt, 
          failedLoginAttempts, 
          lastFailedLoginAttempt, 
          deletedAt, 
          roles,
          createdAt,
          updatedAt,
          ...cleanUser 
        } = user;
        
        return cleanUser;
      }
}
