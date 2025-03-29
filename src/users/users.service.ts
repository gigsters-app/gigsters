import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { CreateUserDto } from './DTOs/create-user.dto';
import { User } from './user.entity';
import { UpdateUserDto } from './DTOs/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/roles/role.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectEntityManager()
        private readonly entityManager: EntityManager,
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
          select: ['id', 'email', 'password'], });
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
}
