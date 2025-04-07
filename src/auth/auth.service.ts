import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/common/mail/mail.service';
import { User } from 'src/users/user.entity';
@Injectable()
export class AuthService {
    constructor(private usersService: UsersService,private jwtService: JwtService ,private readonly configService: ConfigService, private readonly userService: UsersService,   private readonly mailService: MailService,
      
    ) {}
    async signIn(email: string, password: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
          throw new UnauthorizedException('Invalid credentials.');
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          // Increment failed attempts
          user.failedLoginAttempts += 1;
          user.lastFailedLoginAttempt = new Date();
        
          // Lock account if max attempts reached
          if (user.failedLoginAttempts >= 5) {
            user.isActive = false;
        
            await this.userService.save(user); // persist changes
        
            // Send password reset email with token
            await this.sendForceResetEmail(user); // we'll define this next
        
            throw new ForbiddenException('Account locked. Check your email to reset your password.');
          }
        
          await this.userService.save(user);
          throw new UnauthorizedException('Invalid credentials.');
        }

         // 🔒 Return 403 Forbidden if account is not active
          if (!user.isActive) {
            throw new ForbiddenException({
              statusCode: 403,
              error: 'Forbidden',
              message: 'Your account is not activated. Please check your email for the activation link.',
              reason: 'INACTIVE_ACCOUNT',
            });
          }
          // ✅ Successful login: reset failed counter
        user.failedLoginAttempts = 0;
        user.lastFailedLoginAttempt = null;
        await this.userService.save(user);
        const roles = user.roles.map(role => role.name);
        const claims = user.roles.flatMap(role => role.claims.map(claim => claim.name));

  const payload = { 
    sub: user.id, 
    username: user.email,
    isActive:user.isActive,
    roles,             // Array of role names
    claims,            // Array of claim names
  };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
      }

      async activateUserAccount(token: string): Promise<{ message: string }> {
        try {
          const decoded = this.jwtService.verify(token, {
            secret: process.env.ACTIVATION_JWT_SECRET,
          });
      
          const user = await this.userService.findOneById(decoded.sub);
          if (!user) {
            throw new BadRequestException('User not found');
          }
      
          if (user.isActive) {
            return { message: 'Account already activated' };
          }
      
          user.isActive = true;
          await this.userService.save(user);
      
          return { message: 'Account successfully activated' };
        } catch (error) {
          throw new BadRequestException('Invalid or expired activation token');
        }
      }

      async resendActivationEmail(email: string): Promise<{ message: string }> {
        const user = await this.userService.findOneByEmail(email);
      
        if (!user) {
          throw new NotFoundException('No account found with this email.');
        }
      
        if (user.isActive) {
          throw new BadRequestException('Account is already activated.');
        }
      
        // Cooldown logic
        const cooldownMinutes = 5;
        const cooldownMs = cooldownMinutes * 60 * 1000;
      
        if (
          user.lastActivationEmailSentAt &&
          Date.now() - new Date(user.lastActivationEmailSentAt).getTime() < cooldownMs
        ) {
          const nextTryInSec = Math.ceil(
            (cooldownMs - (Date.now() - new Date(user.lastActivationEmailSentAt).getTime())) / 1000
          );
      
          throw new HttpException(
            `Please wait ${nextTryInSec} seconds before requesting another activation email.`,
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
      
        // Generate and send token
        const token = this.jwtService.sign(
          {
            sub: user.id,
            email: user.email,
          },
          {
            secret: process.env.ACTIVATION_JWT_SECRET,
            expiresIn: '24h',
          }
        );
      
        const activationLink = `https://gigsters-production.up.railway.app/auth/activate?token=${token}`;
        await this.mailService.sendActivationEmail(user.email, activationLink);
      
        // Update timestamp
        user.lastActivationEmailSentAt = new Date();
        await this.userService.save(user);
      
        return {
          message: 'A new activation email has been sent. Please check your inbox.',
        };
      }
      


      generateResetToken(userId: string) {
        return this.jwtService.sign(
          { sub: userId},
          { secret: process.env.JWT_SECRET, expiresIn: '15m' }
        );
      }
      
      async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
        try {
          const payload = this.jwtService.verify(token, {
            secret: process.env.JWT_SECRET || 'secret',
          });
      
          const userId = payload.sub;
          const user = await this.userService.findOneById(userId);
          if (!user) throw new ForbiddenException('User not found');
      
          await this.userService.updatePassword(userId, newPassword);
      
          return { message: 'Password has been reset successfully.' };
        } catch (err) {
          throw new ForbiddenException('Invalid or expired token');
        }
      }
     
      async sendForceResetEmail(user: User): Promise<void> {
        const token = this.jwtService.sign(
          { sub: user.id, email: user.email },
          {
            secret:process.env.JWT_SECRET,
            expiresIn: '1h',
          },
        );
      
        const resetLink = `https://gigsters-production.up.railway.app/auth/reset-password?token=${token}`;
        await this.mailService.sendForcePasswordResetEmail(user.email, resetLink);
      }
      
}
