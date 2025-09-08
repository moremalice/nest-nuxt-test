// backend/src/common/pipes/custom-validation.pipe.ts
import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: true,
      exceptionFactory: (errors: ValidationError[] = []) => {
        const first = findFirstConstraint(errors);
        const message = first
          ? `${first.property}: ${first.message}`
          : 'Validation failed';
        return new BadRequestException(message);
      },
      validationError: { target: false, value: false },
    });
  }
}

function findFirstConstraint(
  errors: ValidationError[],
): { property: string; message: string } | null {
  for (const err of errors) {
    if (err.constraints && Object.keys(err.constraints).length > 0) {
      const firstKey = Object.keys(err.constraints)[0];
      return { property: err.property, message: err.constraints[firstKey] };
    }
    if (err.children && err.children.length > 0) {
      const nested = findFirstConstraint(err.children);
      if (nested) return nested;
    }
  }
  return null;
}
