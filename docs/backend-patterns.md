# Backend Architecture Patterns

## ConfigService Pattern

### Environment Configuration Setup

The backend uses `@nestjs/config` with a factory pattern for centralized, type-safe environment variable management:

```typescript
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: [
    `.env.${process.env.NODE_ENV ?? 'local'}`,
    '.env.local',
    '.env',
  ],
  cache: true,
  expandVariables: true,
})
```

### Configuration Factory Pattern

```typescript
// src/config/example.config.ts
import { ConfigService } from '@nestjs/config';

export const exampleConfigs = {
  default: {
    factory: (configService: ConfigService) => ({
      port: configService.get<number>('PORT', 3020),
      nodeEnv: configService.get<string>('NODE_ENV', 'local'),
      isDevelopment: configService.get<string>('NODE_ENV', 'local') !== 'production',
      // Type-safe with default values
      dbHost: configService.get<string>('DB_WORLD_HOST'),
      dbPort: configService.get<number>('DB_WORLD_PORT', 3306),
    })
  }
};
```

### Database Configuration Pattern

```typescript
// src/config/database.config.ts
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
      // Environment-specific settings
      logging: configService.get<boolean>('DB_WORLD_DEV', false),
      synchronize: false,
      namingStrategy: new SnakeNamingStrategy(),
      entities: [join(__dirname, '..', '**/*.entity{.ts,.js}')],
      timezone: '+09:00',
      charset: 'utf8mb4',
    }),
  },
  // place and test configurations follow same pattern
};
```

### Environment-Specific Configuration

```typescript
// src/config/cors.config.ts  
export const corsConfigs = {
  default: {
    factory: (configService: ConfigService): CorsOptions => {
      const nodeEnv = configService.get<string>('NODE_ENV', 'local');

      if (nodeEnv === 'production') {
        return {
          origin: ['https://pikitalk.com', 'https://www.pikitalk.com'],
          credentials: true,
          // Production-specific settings
        };
      }

      return {
        origin: true, // Allow all origins in development
        credentials: true,
        // Development-specific settings
      };
    },
  },
};
```

### Usage in Services

```typescript
// Any service can inject ConfigService
@Injectable()
export class ExampleService {
  constructor(private readonly configService: ConfigService) {}

  someMethod() {
    const port = this.configService.get<number>('PORT', 3020);
    const isDev = this.configService.get<string>('NODE_ENV', 'local') !== 'production';
    
    // Use environment variables with type safety and defaults
    if (isDev) {
      console.log(`Development server running on port ${port}`);
    }
  }
}
```

## Response Transformation Pattern

### Global Response Interceptor

The backend uses `TransformInterceptor` to ensure all API responses follow a consistent format:

```typescript
// backend/src/common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T = any> {
  status: 'success';
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        status: 'success',
        data,
      })),
    );
  }
}
```

### Error Response Pattern

Errors are handled by `HttpExceptionFilter` to maintain consistent error format:

```typescript
// Error responses follow this structure:
interface ErrorResponse {
  status: 'error';
  data: {
    name: string;    // Error type (e.g., 'BadRequestException')
    message: string; // Human-readable error message
  };
}

// Example error response:
{
  "status": "error",
  "data": {
    "name": "ValidationError", 
    "message": "Email is required"
  }
}
```

### Controller Implementation

Controllers return raw data - the interceptor handles wrapping:

```typescript
@Controller('users')
export class UserController {
  @Get()
  async getUsers(): Promise<User[]> {
    // Return raw data - interceptor will wrap in success format
    return await this.userService.findAll();
  }

  @Post()
  async createUser(@Body() userData: CreateUserDto): Promise<User> {
    // Raw data returned, automatically wrapped as:
    // { status: 'success', data: User }
    return await this.userService.create(userData);
  }
}
```

## Module Structure Template

Each backend module follows this consistent structure:

```
src/module/{module-name}/
├── {module}.controller.ts      # API endpoints
├── {module}.service.ts         # Business logic
├── {module}.module.ts          # Module configuration
├── dto/                        # Data transfer objects
├── entities/                   # TypeORM entities
├── guards/                     # Authentication guards (if needed)
├── interfaces/                 # TypeScript interfaces
└── strategies/                 # Passport strategies (auth module only)
```

## Database Connection Pattern

```typescript
// Service pattern with explicit database connection
@Injectable()
export class ExampleService {
  constructor(
    @InjectRepository(EntityName, 'piki_world_db')    // Primary database
    private readonly repository: Repository<EntityName>
  ) {}
}

// Available connections:
// - 'piki_world_db': Main application data
// - 'piki_place_db': Location/geographic data  
// - 'test_user_db': Test environment data
```

## DTO Validation Pattern

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsString, IsOptional, Min, Max } from 'class-validator';

export class ExampleDto {
  @ApiProperty({ example: 'example', description: 'Example field' })
  @IsString()
  field: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  page?: number;
}
```

## Response Standardization Pattern

### TransformInterceptor

The application uses a global `TransformInterceptor` that automatically wraps all successful responses in a standard format:

```typescript
// All controller responses are automatically transformed:
// Raw return: { id: 1, name: "John" }
// Becomes: { status: "success", data: { id: 1, name: "John" } }
```

**Standard Response Format:**
```typescript
// Success Response
interface SuccessResponse<T> {
  status: 'success'
  data: T
}

// Error Response (from HttpExceptionFilter)
interface ErrorResponse {
  status: 'error'
  data: {
    name: string    // Exception class name
    message: string // Localized error message
  }
}
```

### When to Use @Res({ passthrough: true })

**Standard Practice:** Let interceptor handle response formatting
```typescript
@Get('/standard')
async getStandard() {
  return { message: 'Hello World' };
  // Becomes: { status: 'success', data: { message: 'Hello World' } }
}
```

**Use Passthrough Only When Setting Cookies/Headers:**
```typescript
@Post('/login')
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) response: Response,
): Promise<AuthResponseDto> {
  const result = await this.authService.login(loginDto);
  
  // Set refresh token cookie
  response.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    sameSite: 'strict'
  });
  
  // Return data - interceptor will wrap it
  return {
    accessToken: result.accessToken,
    user: result.user
  };
  // Final response: { status: 'success', data: { accessToken: "...", user: {...} } }
}
```

**Avoid Direct Response Manipulation:**
```typescript
// ❌ Don't do this - bypasses interceptor
@Get('/bad-example')
async badExample(@Res() response: Response) {
  response.json({ message: 'Hello' }); // No standard format
}

// ✅ Do this instead
@Get('/good-example')
async goodExample() {
  return { message: 'Hello' }; // Interceptor wraps automatically
}
```

## Controller Pattern

```typescript
@Controller('example')
@ApiTags('WEB')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Get()
  @ApiOperation({ summary: 'Get example list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getExampleList(@Query() query: ExampleDto) {
    return this.exampleService.getExampleList(query);
    // Interceptor automatically wraps in standard format
  }

  @Post()
  @ApiSecurity('csrf-token')  // Required for mutations
  @ApiOperation({ summary: 'Create example' })
  async createExample(@Body() body: CreateExampleDto) {
    return this.exampleService.createExample(body);
    // Interceptor automatically wraps in standard format
  }

  @Post('/with-cookie')
  @ApiOperation({ summary: 'Example with cookie setting' })
  async exampleWithCookie(
    @Body() body: CreateExampleDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.exampleService.createExample(body);
    
    // Set custom cookie
    response.cookie('example-session', result.sessionId, {
      httpOnly: true,
      maxAge: 3600000
    });
    
    return result; // Still gets wrapped by interceptor
  }
}
```

## Error Handling Pattern

### I18n-Based Error Handling

The backend uses `nestjs-i18n` for internationalized error messages:

```typescript
// Service with I18nService injection
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ExampleService {
  constructor(
    private readonly i18n: I18nService,
    // other dependencies
  ) {}

  async someMethod(): Promise<SomeType> {
    try {
      // business logic
      const result = await this.performOperation();
      return result;
    } catch (error) {
      console.error('[ExampleService] Error:', error.message);
      throw new BadRequestException(
        this.i18n.translate('domain.ERROR_MESSAGE_KEY')
      );
    }
  }
}
```

### I18n Configuration Structure

**Language Files Structure:**
```
backend/src/common/i18n/
├── ko/
│   └── common.json    # Korean translations
├── en/
│   └── common.json    # English translations
└── custom-language.resolver.ts
```

**Translation Key Naming Convention:**
```typescript
// Format: domain.ERROR_TYPE
// Examples:
this.i18n.translate('policy.TERMS_NOT_FOUND')
this.i18n.translate('auth.INVALID_CREDENTIALS')
this.i18n.translate('community.FAQ_LIST_ERROR')
```

### Language Resolution

The system automatically detects user language through:

1. **Query Parameter** (highest priority): `?lang=ko` or `?lang=en`
2. **Custom Header**: `x-custom-lang: ko`
3. **Accept-Language Header**: Browser language preference
4. **Default**: Falls back to `en`

### Translation File Example

```json
// backend/src/common/i18n/ko/common.json
{
  "auth": {
    "EMAIL_ALREADY_EXISTS": "이미 등록된 이메일 주소입니다.",
    "INVALID_CREDENTIALS": "이메일 또는 비밀번호가 잘못되었습니다.",
    "USER_NOT_FOUND": "사용자를 찾을 수 없습니다.",
    "UNAUTHORIZED": "인증이 필요합니다."
  },
  "community": {
    "FAQ_LIST_ERROR": "FAQ 목록을 불러오는 중 오류가 발생했습니다.",
    "NOTICE_NOT_FOUND": "요청하신 공지사항을 찾을 수 없습니다."
  }
}
```

### Standard HTTP Exceptions with I18n

```typescript
// Authentication errors
throw new UnauthorizedException(
  this.i18n.translate('auth.UNAUTHORIZED')
);

// Not found errors  
throw new NotFoundException(
  this.i18n.translate('domain.RESOURCE_NOT_FOUND')
);

// Validation errors
throw new BadRequestException(
  this.i18n.translate('domain.VALIDATION_ERROR')
);

// Forbidden errors
throw new ForbiddenException(
  this.i18n.translate('auth.FORBIDDEN')
);
```

### Error Message Best Practices

1. **Use Domain Prefixes**: Group related errors by domain (`auth.`, `policy.`, `community.`)
2. **Descriptive Keys**: Use clear, descriptive key names (`EMAIL_ALREADY_EXISTS`)
3. **Consistent Format**: Follow UPPERCASE_WITH_UNDERSCORES convention
4. **User-Friendly Messages**: Write messages from user perspective
5. **Fallback**: Always provide English translations as fallback