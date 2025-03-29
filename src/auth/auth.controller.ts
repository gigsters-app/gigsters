import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignInDto } from './DTOs/signin.dto';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './DTOs/forgot-password.dto';
import { ResetPasswordDto } from './DTOs/reset-password.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns authentication token.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials provided.' })
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Send a test email to verify mail service' })
  sendTestEmail() {
    return this.authService.sendTestEmail();
  }
}
