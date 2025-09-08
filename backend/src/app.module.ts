// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { I18nModule } from 'nestjs-i18n';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { SecurityModule } from './module/security/security.module';
import { AuthModule } from './module/auth/auth.module';
import { CommunityModule } from './module/community/community.module';
import { FileModule } from './module/file/file.module';
import { LinkModule } from './module/link/link.module';
import { PolicyModule } from './module/policy/policy.module';

import { databaseConfigs, i18nConfigs } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'local'}`,
        '.env.local',
        '.env',
      ],
      cache: true,
      expandVariables: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    ScheduleModule.forRoot(),

    I18nModule.forRootAsync({
      useFactory: i18nConfigs.default.factory,
      resolvers: i18nConfigs.default.resolvers,
    }),

    TypeOrmModule.forRootAsync({
      name: databaseConfigs.world.name,
      useFactory: databaseConfigs.world.factory,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: databaseConfigs.place.name,
      useFactory: databaseConfigs.place.factory,
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
        name: databaseConfigs.test.name,
        useFactory: databaseConfigs.test.factory,
        inject: [ConfigService],
    }),

    CommonModule,
    AuthModule,
    CommunityModule,
    PolicyModule,
    SecurityModule,
    FileModule,
    LinkModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
