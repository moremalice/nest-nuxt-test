// backend/src/module/security/security.module.ts
import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CsrfController } from './csrf.controller';
import { CsrfService } from './csrf.service';
import { SmartCsrfMiddleware } from './middleware/smart-csrf.middleware';

@Module({
    imports: [ConfigModule],
    controllers: [CsrfController],
    providers: [CsrfService, SmartCsrfMiddleware],
    exports: [CsrfService],
})
export class SecurityModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // Ensure this runs after cookieParser (registered in main.ts)
        consumer
            .apply(SmartCsrfMiddleware)
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
