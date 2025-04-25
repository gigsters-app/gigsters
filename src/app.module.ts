import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BusinessProfileModule } from './business-profile/business-profile.module';
import { ClientModule } from './client/client.module';
import { InvoiceModule } from './invoice/invoice.module';
import { QuotationModule } from './quotation/quotation.module';
import { BusinessItemModule } from './business-item/business-item.module';
import { AclGuard } from './acl/acl.guard';
import { AuthGuard } from './auth/auth.guard';
import { RolesModule } from './roles/roles.module';
import { ClaimsModule } from './claims/claims.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // TypeOrmModule.forRoot({
    //   type: 'mysql',
    //   host: 'mysql.railway.internal',
    //   port: 3306,
    //   username: 'root',
    //   password: 'yvKOdIyslhrSNyALWVwIQRKsgadjEQwn',
    //   database: 'railway',
    //   entities: [__dirname + '/**/*.entity{.ts,.js}'],
    //   synchronize: true,
    // }),
     TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'project-gigsters',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    UsersModule,
    AuthModule,
    BusinessProfileModule,
    ClientModule,
    InvoiceModule,
    QuotationModule,
    BusinessItemModule,
    RolesModule,
    ClaimsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AclGuard,
    },
  ],
})
export class AppModule {}
