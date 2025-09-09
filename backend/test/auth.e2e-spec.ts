import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { App } from 'supertest/types';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { User } from '../src/module/auth/entities/user.entity';
import { RegisterDto } from '../src/module/auth/dto/register.dto';
import { CsrfService } from '../src/module/security/csrf.service';
import { SmartCsrfMiddleware } from '../src/module/security/middleware/smart-csrf.middleware';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User, 'test_user_db'),
    );

    // Setup cookie parser and CSRF middleware like in main.ts
    app.use(cookieParser());
    
    // Get CSRF service and apply middleware
    const csrfService = app.get(CsrfService);
    const smartCsrfMiddleware = new SmartCsrfMiddleware(csrfService);
    app.use(smartCsrfMiddleware.use.bind(smartCsrfMiddleware));

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (userRepository) {
      await userRepository.delete({ email: 'test@example.com' });
      await userRepository.delete({ email: 'existing@example.com' });
    }
    await app.close();
  });

  beforeEach(async () => {
    // Clean up any existing test users
    await userRepository.delete({ email: 'test@example.com' });
    await userRepository.delete({ email: 'existing@example.com' });
  });

  describe('/auth/test (GET)', () => {
    it('should return test message', () => {
      return request(app.getHttpServer())
        .get('/auth/test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body.message).toBe('Auth module is working correctly');
        });
    });
  });

  describe('/auth/register (POST)', () => {
    const validRegisterDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user (mobile)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile') // Skip CSRF for mobile
        .send(validRegisterDto)
        .expect(201);

      // Register endpoint currently doesn't use TransformInterceptor
      expect(response.body).toHaveProperty('idx');
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body.email).toBe(validRegisterDto.email);

      // Verify user was created in database
      const createdUser = await userRepository.findOne({
        where: { email: validRegisterDto.email },
      });
      expect(createdUser).not.toBeNull();
      expect(createdUser?.email).toBe(validRegisterDto.email);
      expect(createdUser?.isActive).toBe(true);
    });

    it('should successfully register a new user (web with CSRF)', async () => {
      const webUser = {
        email: 'web-user@example.com',
        password: 'password123',
      };

      // Clean up any existing user first
      await userRepository.delete({ email: webUser.email });

      // First, get CSRF token
      const tokenResponse = await request(app.getHttpServer())
        .get('/csrf/token')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .expect(200);

      const csrfToken = tokenResponse.body.data.csrfToken;
      const cookies = tokenResponse.headers['set-cookie'];
      
      // Format cookies properly for request
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies || '';

      // Register with CSRF token
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookieStr)
        .send(webUser)
        .expect(201);

      console.log('Web Registration Response:', JSON.stringify(response.body, null, 2));
      // Register endpoint currently doesn't use TransformInterceptor
      expect(response.body).toHaveProperty('idx');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(webUser.email);

      // Verify user was created in database
      const createdUser = await userRepository.findOne({
        where: { email: webUser.email },
      });
      expect(createdUser).not.toBeNull();
      expect(createdUser?.email).toBe(webUser.email);
      expect(createdUser?.isActive).toBe(true);

      // Clean up
      await userRepository.delete({ email: webUser.email });
    });

    it('should fail registration for web client without CSRF token', async () => {
      const webUser = {
        email: 'web-fail@example.com',
        password: 'password123',
      };

      // Try to register without CSRF token using browser User-Agent
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .send(webUser)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should not set refresh token cookie during registration', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(validRegisterDto)
        .expect(201);

      const cookies = response.headers['set-cookie'];
      // Registration should NOT set cookies, only login does
      if (cookies) {
        const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
        expect(cookieArray.some((cookie: string) => 
          cookie.includes('ref_token_')
        )).toBe(false);
      }
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(validRegisterDto)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(validRegisterDto)
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 400 for invalid email', () => {
      const invalidEmailDto = {
        email: 'invalid-email',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(invalidEmailDto)
        .expect(400);
    });

    it('should return 400 for short password', () => {
      const shortPasswordDto = {
        email: 'test@example.com',
        password: '123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(shortPasswordDto)
        .expect(400);
    });

    it('should return 400 for missing email', () => {
      const missingEmailDto = {
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(missingEmailDto)
        .expect(400);
    });

    it('should return 400 for missing password', () => {
      const missingPasswordDto = {
        email: 'test@example.com',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(missingPasswordDto)
        .expect(400);
    });

    it('should hash the password in database', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(validRegisterDto)
        .expect(201);

      const createdUser = await userRepository.findOne({
        where: { email: validRegisterDto.email },
      });

      expect(createdUser?.password).not.toBe(validRegisterDto.password);
      expect(createdUser?.password).toMatch(/^\$2[aby]?\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('/auth/login (POST)', () => {
    const loginDto = {
      email: 'login-test@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      // Clean up and create test user for login tests
      await userRepository.delete({ email: loginDto.email });
      
      // Register a user first for login tests
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(loginDto)
        .expect(201);
    });

    afterEach(async () => {
      await userRepository.delete({ email: loginDto.email });
    });

    it('should successfully login and return tokens for web client (with CSRF)', async () => {
      // First, get CSRF token
      const tokenResponse = await request(app.getHttpServer())
        .get('/csrf/token')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .expect(200);

      const csrfToken = tokenResponse.body.data.csrfToken;
      const csrfCookies = tokenResponse.headers['set-cookie'];
      
      // Format cookies properly for request
      const cookieStr = Array.isArray(csrfCookies) ? csrfCookies.join('; ') : csrfCookies || '';

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', cookieStr)
        .send(loginDto)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).not.toHaveProperty('refreshToken'); // Should be in cookie for web
      expect(response.body.data.user.email).toBe(loginDto.email);

      // Check refresh token cookie is set for web clients
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
      expect(cookieArray.some((cookie: string) => 
        cookie.includes('ref_token_')
      )).toBe(true);
    });

    it('should return both tokens in body for mobile client', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Client-Type', 'mobile')
        .send(loginDto)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken'); // Mobile gets refresh token in body
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(loginDto.email);

      // Mobile clients should have CSRF skipped header
      expect(response.headers['x-csrf-skipped']).toBe('mobile-client');
    });

    it('should return 401 for invalid credentials', async () => {
      const invalidDto = {
        email: loginDto.email,
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Client-Type', 'mobile')
        .send(invalidDto)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.data).toHaveProperty('message');
    });

    it('should return 401 for non-existent user', async () => {
      const nonExistentDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Client-Type', 'mobile')
        .send(nonExistentDto)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.data).toHaveProperty('message');
    });
  });

  describe('Rate limiting', () => {
    const registerDto: RegisterDto = {
      email: 'rate-test@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      await userRepository.delete({ email: 'rate-test@example.com' });
    });

    afterEach(async () => {
      await userRepository.delete({ email: 'rate-test@example.com' });
    });

    it('should apply rate limiting after multiple registration attempts', async () => {
      // Register a user first to trigger conflicts
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(registerDto)
        .expect(201);

      // Make 5 conflicting registration attempts (throttle limit)
      const promises = Array(6)
        .fill(0)
        .map(() =>
          request(app.getHttpServer())
            .post('/auth/register')
            .set('X-Client-Type', 'mobile')
            .send(registerDto),
        );

      const responses = await Promise.allSettled(promises);

      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (response) =>
          response.status === 'fulfilled' &&
          (response.value as any).status === 429,
      );

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);
  });
});