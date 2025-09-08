// backend/src/common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

export interface SuccessResponse<T = any> {
  status: 'success';
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  constructor(private readonly configService: ConfigService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'local');
    const isDev = nodeEnv !== 'production';

    return next.handle().pipe(
      map((data) => {
        const response: SuccessResponse<T> = {
          status: 'success',
          data,
        };
        return response;
      }),
    );
  }
}
