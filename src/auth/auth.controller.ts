import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Param, Post, Query, Render } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SignInDto } from './DTOs/signin.dto';
import { Public } from './decorators/public.decorator';
import { RegisterUserDto } from 'src/users/DTOs/register-user.dto';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/common/mail/mail.service';
import { RegisterDto } from 'src/users/DTOs/register.dto';
import { CreateUserDto } from 'src/users/DTOs/create-user.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private readonly userService: UsersService,private readonly configService: ConfigService,
      private readonly jwtService: JwtService,
      private readonly mailService: MailService,) {}

      @Public()
      @Post('register')
      @ApiOperation({ summary: 'Register a new user with email & password' })
      @ApiBody({ type: RegisterDto, description: 'Email and password for the new account' })
      @ApiCreatedResponse({
        description: 'User account created successfully',
        type: CreateUserDto,
      })
      @ApiBadRequestResponse({
        description: 'Validation or uniqueness error',
      })
      registerBasic(@Body() dto: RegisterDto): Promise<CreateUserDto> {
        return this.userService.registerBasicUser(dto);
      }
    

    @Public()
    @Post('register-with-business-profile')
    @ApiOperation({ summary: 'Register new user with business profile' })
    @ApiResponse({ status: 201, description: 'User registered', type: User })
    async register(@Body() dto: RegisterUserDto) {
      return this.userService.registerUserWithBusinessProfile(dto);
    }

    @ApiTags('Auth')
    @Public()
    @Get('activate')
    @ApiOperation({ summary: 'Activate user account' })
    @ApiQuery({
      name: 'token',
      type: String,
      required: true,
      description: 'JWT token sent to the user\'s email for account activation',
    })
    @ApiResponse({ status: 200, description: 'Account activated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired activation token' })
    async activateAccount(@Query('token') token: string) {
      return this.authService.activateUserAccount(token);
    }

    @Public()
    @Post('resend-activation')
    @ApiTags('Auth')
    @ApiOperation({ summary: 'Resend account activation email' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'johndoe@example.com',
            description: 'The email of the user who needs a new activation link',
          },
        },
        required: ['email'],
      },
    })
    @ApiResponse({ status: 200, description: 'New activation email sent' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'Account already activated' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    async resendActivation(@Body('email') email: string) {
      return this.authService.resendActivationEmail(email);
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
      @ApiTags('Auth')
      @ApiOperation({ summary: 'Request password reset link' })
      @ApiBody({
        schema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              description: 'Email address of the account to reset',
            },
          },
          required: ['email'],
        },
      })
    @ApiResponse({
      status: 201,
      description: 'Reset link sent (if the account exists)',
    })
    @ApiResponse({
      status: 400,
      description: 'Invalid input or format',
    })
      async forgotPassword(@Body('email') email: string) {
        const user = await this.userService.findOneByEmail(email);
        if (!user) {
          // Avoid email enumeration by returning generic success message
          // even when user doesn't exist
          return { message: 'If an account with that email exists, a password reset link has been sent.' };
        }

        const token = this.authService.generateResetToken(user.id);

        const resetLink = `https://gigsters-production.up.railway.app/auth/reset-password?token=${token}`;
        await this.mailService.sendPasswordResetEmail(user.email, resetLink);
        
        return { message: 'If an account with that email exists, a password reset link has been sent.' };
      }

      @Public()
      @Get('reset-password')
      @Render('reset-password') // renders views/reset-password.hbs
      showResetPasswordPage(@Query('token') token: string) {
        return { token };
      }

    @Public()
    @Post('reset-password')
    @ApiTags('Auth')
    @ApiOperation({ summary: 'Reset password using a token' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'JWT token sent to user\'s email for resetting password',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          newPassword: {
            type: 'string',
            description: 'The new password to set',
            example: 'StrongP@ssw0rd!',
          },
        },
        required: ['token', 'newPassword'],
      },
    })
    @ApiResponse({ status: 200, description: 'Password reset successfully' })
    @ApiResponse({ status: 403, description: 'Invalid or expired token' })
    async resetPassword(
      @Body('token') token: string,
      @Body('newPassword') newPassword: string
    ) {
      return this.authService.resetPassword(token, newPassword);
    }


    @Public()
    @Get('generate-reset-token/:userId')
    @ApiTags('Auth')
    @ApiOperation({ summary: 'Generate password reset token for a user (for testing or admin use)' })
    @ApiParam({
      name: 'userId',
      type: 'string',
      description: 'The ID of the user to generate a reset token for',
      example: '9a806017-ae22-4910-897d-5a82339195d1',
    })
    @ApiResponse({ status: 200, description: 'Reset token generated successfully' })
    generateResetToken(@Param('userId') userId: string) {
      return this.authService.generateResetToken(userId);
    }

    @Public()
    @Get('send-test-email')
    @ApiTags('Auth')
    @ApiOperation({ summary: 'Send a test email to verify SES configuration' })
    @ApiResponse({ status: 200, description: 'Test email sent successfully' })
    async sendTestEmail() {
      return this.mailService.sendTestEmail();
    }

 
}
