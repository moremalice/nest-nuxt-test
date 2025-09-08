import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { User } from '../src/module/auth/entities/user.entity';
import { RegisterDto } from '../src/module/auth/dto/register.dto';

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

    it('should successfully register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).not.toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(validRegisterDto.email);
      expect(response.body.data.user.isActive).toBe(true);

      // Verify user was created in database
      const createdUser = await userRepository.findOne({
        where: { email: validRegisterDto.email },
      });
      expect(createdUser).not.toBeNull();
      expect(createdUser?.email).toBe(validRegisterDto.email);
      expect(createdUser?.isActive).toBe(true);
    });

    it('should set refresh token cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => 
        cookie.includes('ref_token_')
      )).toBe(true);
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      // Second registration with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
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
        .send(shortPasswordDto)
        .expect(400);
    });

    it('should return 400 for missing email', () => {
      const missingEmailDto = {
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(missingEmailDto)
        .expect(400);
    });

    it('should return 400 for missing password', () => {
      const missingPasswordDto = {
        email: 'test@example.com',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(missingPasswordDto)
        .expect(400);
    });

    it('should hash the password in database', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      const createdUser = await userRepository.findOne({
        where: { email: validRegisterDto.email },
      });

      expect(createdUser?.password).not.toBe(validRegisterDto.password);
      expect(createdUser?.password).toMatch(/^\$2[aby]?\$\d+\$/); // bcrypt hash pattern
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
        .send(registerDto)
        .expect(201);

      // Make 5 conflicting registration attempts (throttle limit)
      const promises = Array(6)
        .fill(0)
        .map(() =>
          request(app.getHttpServer())
            .post('/auth/register')
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