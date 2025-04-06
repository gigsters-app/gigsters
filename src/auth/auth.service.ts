import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/common/mail/mail.service';
@Injectable()
export class AuthService {
    constructor(private usersService: UsersService,private jwtService: JwtService ,private readonly configService: ConfigService,   private readonly mailService: MailService,
      
    ) {}
    async signIn(email: string, password: string): Promise<any> {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
          throw new UnauthorizedException('Invalid credentials.');
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          throw new UnauthorizedException('Invalid credentials.');
        }
        const roles = user.roles.map(role => role.name);
  const claims = user.roles.flatMap(role => role.claims.map(claim => claim.name));

  const payload = { 
    sub: user.id, 
    username: user.email,
    roles,             // Array of role names
    claims,            // Array of claim names
  };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
      }


      generateResetToken(userId: string) {
        return this.jwtService.sign(
          { sub: userId},
          { secret: "secret", expiresIn: '15m' }
        );
      }
      
     
     
}
