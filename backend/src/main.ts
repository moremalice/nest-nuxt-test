// /backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { CsrfService } from './module/security/csrf.service';
import { CustomValidationPipe } from './common/pipes/custom-validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as cookieParser from 'cookie-parser';
import helmet, { referrerPolicy, permittedCrossDomainPolicies } from 'helmet';
import { corsConfigs, swaggerConfigs, helmetConfigs } from './config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.enableCors(corsConfigs.default.factory(configService));

  // 프록시 환경 설정 (Ingress/ALB/NGINX 등 뒤에서 실행 시 실제 IP 추적)
  app.set('trust proxy', 1);

  const helmetEnabled = helmetConfigs.default.factory(configService);
  if (helmetEnabled) {
    app.use(helmet());
    app.use(referrerPolicy({ policy: 'no-referrer' }));
    app.use(permittedCrossDomainPolicies());
    // CSP는 Nuxt/3rd-party 튜닝 후 도입 권장
  }

  app.use(cookieParser());

  const csrfService = app.get<CsrfService>(CsrfService);
  app.use(csrfService.protection);

  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter(configService));
  app.useGlobalInterceptors(
    new LoggingInterceptor(configService),
    new TransformInterceptor(configService),
  );

  const nodeEnv = configService.get<string>('NODE_ENV', 'local');
  const enableSwagger = ['local', 'development'].includes(nodeEnv);

  const swaggerConfig = enableSwagger
    ? swaggerConfigs.default.factory(configService)
    : undefined;
  if (enableSwagger && swaggerConfig) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }

  const port = configService.get<number>('PORT', 3020);
  await app.listen(port);

  const serverHost = configService.get<string>('SERVER_HOST', 'localhost');

  console.log(`🚀 Application is running on port: ${port}`);
  console.log(`🌍 Environment: ${nodeEnv}`);

  if (swaggerConfig) {
    // Swagger는 local과 development 환경에서만 활성화
    const swaggerUrl =
      nodeEnv === 'local'
        ? `http://localhost:${port}/api`
        : `http://${serverHost}/api`;
    console.log(`📚 Swagger UI: ${swaggerUrl}`);
  }
}

// 에러 처리와 함께 bootstrap 실행
bootstrap().catch((error) => {
  console.error('❌ Failed to start the application:', error);
  process.exit(1);
});
