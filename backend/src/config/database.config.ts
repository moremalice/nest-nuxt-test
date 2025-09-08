// backend/src/config/database.config.ts
import {TypeOrmModuleOptions} from '@nestjs/typeorm';
import {ConfigService} from '@nestjs/config';
import {SnakeNamingStrategy} from 'typeorm-naming-strategies';
import {join} from 'path';

export const databaseConfigs = {
    world: {
        name: 'piki_world_db',
        factory: (configService: ConfigService): TypeOrmModuleOptions => ({
            type: 'mysql',
            host: configService.get<string>('DB_WORLD_HOST'),
            port: configService.get<number>('DB_WORLD_PORT', 3306),
            username: configService.get<string>('DB_WORLD_USERNAME'),
            password: configService.get<string>('DB_WORLD_PASSWORD'),
            database: configService.get<string>('DB_WORLD_DATABASE'),
            synchronize: false,
            namingStrategy: new SnakeNamingStrategy(),
            entities: [join(__dirname, '..', '**/*.entity{.ts,.js}')],
            timezone: '+09:00',
            charset: 'utf8mb4',
            logging: configService.get<boolean>('DB_WORLD_DEV', false),
        }),
    },
    place: {
        name: 'piki_place_db',
        factory: (configService: ConfigService): TypeOrmModuleOptions => ({
            type: 'mysql',
            host: configService.get<string>('DB_PLACE_HOST'),
            port: configService.get<number>('DB_PLACE_PORT', 13306),
            username: configService.get<string>('DB_PLACE_USERNAME'),
            password: configService.get<string>('DB_PLACE_PASSWORD'),
            database: configService.get<string>('DB_PLACE_DATABASE'),
            synchronize: false,
            namingStrategy: new SnakeNamingStrategy(),
            entities: [join(__dirname, '..', '**/*.entity{.ts,.js}')],
            timezone: '+09:00',
            charset: 'utf8mb4',
            logging: configService.get<boolean>('DB_PLACE_DEV', false),
        }),
    },
    test: {
        name: 'test_user_db',
        factory: (configService: ConfigService): TypeOrmModuleOptions => ({
            type: 'mysql',
            host: configService.get<string>('DB_TEST_USER_HOST'),
            port: configService.get<number>('DB_TEST_USER_PORT', 13306),
            username: configService.get<string>('DB_TEST_USER_USERNAME'),
            password: configService.get<string>('DB_TEST_USER_PASSWORD'),
            database: configService.get<string>('DB_TEST_USER_DATABASE'),
            synchronize: false,
            namingStrategy: new SnakeNamingStrategy(),
            entities: [join(__dirname, '..', '**/*.entity{.ts,.js}')],
            timezone: '+09:00',
            charset: 'utf8mb4',
            logging: configService.get<boolean>('DB_TEST_USER_DEV', false),
        }),
    },
};
