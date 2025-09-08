// backend/src/common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('LoggingInterceptor');

  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'local');
    const isDev = nodeEnv !== 'production';

    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;

          this.logger.log(
            `[${request.method}/${response.statusCode}] ${request.url} +${responseTime}ms`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          this.logger.error(
            `[${request.method}/${response.statusCode || 500}] ${request.url} +${responseTime}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
