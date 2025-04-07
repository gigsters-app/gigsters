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
const activationLink = `https://gigsters-production.up.railway.app/auth/activate?token=${activationToken}`;

await this.emailService.sendActivationEmail(savedUser.email, activationLink);

      return savedUser;
    });
  }
    
      async findAll(): Promise<User[]> {
        return this.entityManager.find(User);
      }
    
      async findOneById(id: string): Promise<User> {
        const user = await this.entityManager.findOne(User, { where: { id } });
        if (!user) throw new NotFoundException(`User with id ${id} not found`);
        return user;
      }
    
      async findOneByEmail(email: string): Promise<User> {
        const user = await this.entityManager.findOne(User, { where: { email },relations: ['roles', 'roles.claims'],
          select: ['id', 'email', 'password','isActive','lastActivationEmailSentAt','failedLoginAttempts','failedLoginAttempts'], });
        if (!user) throw new NotFoundException(`User with email ${email} not found`);
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
      
}
