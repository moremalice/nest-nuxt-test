// backend/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

export interface ErrorData {
  name: string;
  message: string;
}

export interface ErrorResponse {
  status: 'error';
  data: ErrorData;
  statusCode?: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const nodeEnv = this.configService.get<string>('NODE_ENV', 'local');
    const isDev = nodeEnv !== 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let exceptionName = 'InternalServerError';

    // Exception 타입별 처리
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      exceptionName = exception.constructor.name;
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        const resObj = exceptionResponse as any;
        const raw = resObj.message ?? resObj.error ?? message;

        if (Array.isArray(raw)) {
          // 문자열 배열 vs 객체 배열 분기
          if (raw.every((v) => typeof v === 'string')) {
            message = raw.join(', ');
          } else {
            // 객체 배열(커스텀 Validation 등)은 일반 문구로 통일
            message = 'Validation failed';
          }
        } else if (typeof raw === 'string') {
          message = raw;
        }

        if (typeof resObj.statusCode === 'number') {
          status = resObj.statusCode;
        }
      }
    } else if (exception instanceof Error) {
      exceptionName = exception.constructor.name;
      message = exception.message || message;
    }

    // prod에서 5xx 상세 메시지 노출 차단
    if (!isDev && status >= 500) {
      message = 'Internal server error';
    }

    const errorResponse: ErrorResponse = {
      status: 'error',
      data: {
        name: exceptionName,
        message: message,
      },
    };

    this.logger.error(
      `HTTP Exception: ${status} - ${exceptionName} - ${message} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    response.status(status).json(errorResponse);
  }
}
