import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignInDto } from './DTOs/signin.dto';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './DTOs/forgot-password.dto';
import { ResetPasswordDto } from './DTOs/reset-password.dto';
import { RegisterUserDto } from 'src/users/DTOs/register-user.dto';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/common/mail/mail.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private readonly userService: UsersService,private readonly configService: ConfigService,
      private readonly jwtService: JwtService,
      private readonly mailService: MailService,) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register new user with business profile' })
    @ApiResponse({ status: 201, description: 'User registered', type: User })
    async register(@Body() dto: RegisterUserDto) {
      return this.userService.registerUserWithBusinessProfile(dto);
    }


  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns authentication token.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials provided.' })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }
    @Public()
    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
      const user = await this.userService.findOneByEmail(email);
      if (!user) return; // Avoid email enumeration

      const token = this.authService.generateResetToken(user.id);

      const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;
      await this.mailService.sendPasswordResetEmail(user.email, resetLink);
    }

@Public()
@Post('reset-password')
async resetPassword(
  @Body('token') token: string,
  @Body('newPassword') newPassword: string
) {
  try {
    const payload = this.jwtService.verify(token, {
      secret: "secret",
    });

    const userId = payload.sub;
    const user = await this.userService.findOneById(userId);
    if (!user) throw new ForbiddenException();

    await this.userService.updatePassword(userId, newPassword);
  } catch (err) {
    throw new ForbiddenException('Invalid or expired token');
  }
}
@Public()
@Get('generate-reset-token/:userId')
generateResetToken(@Param('userId') userId: string) {
  return this.authService.generateResetToken(userId);
}

@Public()
@Get('send-test-email')
async sendTestEmail() {
  return this.mailService.sendTestEmail();
}

 
}
