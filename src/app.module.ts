import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { RolesModule } from './roles/roles.module';
import { AclModule } from './acl/acl.module';
import { ClaimsModule } from './claims/claims.module';
import { BusinessProfileModule } from './business-profile/business-profile.module';
import { MailModule } from './common/mail/mail.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'mysql.railway.internal',
      port: 3306,
      username: 'root',
      password: 'yvKOdIyslhrSNyALWVwIQRKsgadjEQwn',
      database: 'railway',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: 'localhost',
    //   port: 3306,
    //   username: 'root',
    //   password: '',
    //   database: 'project-gigsters',
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   synchronize: true,
    // }),
    AuthModule,
    UsersModule,
    RolesModule,
    AclModule,
    ClaimsModule,
    BusinessProfileModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
