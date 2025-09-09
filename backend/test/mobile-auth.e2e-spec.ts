// /backend/test/mobile-auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  expectSuccessResponse,
  expectErrorResponse,
  expectMobileClientResponse,
  expectWebClientResponse,
  UserData,
  LoginResponseData,
  RefreshResponseData
} from './test-helpers';

describe('Mobile Authentication (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string | undefined;
  
  const testUser = {
    email: `mobile.test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Mobile-specific endpoints', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expectSuccessResponse<UserData>(response.body, (data) => {
        expect(data).toHaveProperty('idx');
        expect(data).toHaveProperty('email');
        expect(data.email).toBe(testUser.email);
      });
    });

    it('should login via mobile endpoint and return tokens in body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/mobile/login')
        .send(testUser)
        .expect(200);

      expectSuccessResponse<LoginResponseData>(response.body, (data) => {
        expect(data).toHaveProperty('accessToken');
        expect(data).toHaveProperty('refreshToken');
        expect(data).toHaveProperty('user');
        expect(data.user.email).toBe(testUser.email);
      });
      expectMobileClientResponse(response, false); // No CSRF skipped header for mobile-specific endpoint
      
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should refresh tokens via mobile endpoint with Bearer token', async () => {
      expect(refreshToken).toBeDefined();
      const response = await request(app.getHttpServer())
        .post('/auth/mobile/refresh')
        .set('Authorization', `Bearer ${refreshToken!}`)
        .expect(200);

      expectSuccessResponse<RefreshResponseData>(response.body, (data) => {
        expect(data).toHaveProperty('accessToken');
        expect(data).toHaveProperty('refreshToken');
        expect(typeof data.accessToken).toBe('string');
        expect(typeof data.refreshToken).toBe('string');
      });
      expectMobileClientResponse(response, false); // No CSRF skipped header for mobile-specific endpoint
      
      // Update tokens for subsequent tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should access protected route with access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expectSuccessResponse(response.body, (data) => {
        expect(data).toHaveProperty('user');
        expect(data.user).toHaveProperty('email');
        expect(data.user.email).toBe(testUser.email);
      });
    });
  });

  describe('Universal endpoints with X-Client-Type header', () => {
    let mobileAccessToken: string;
    let mobileRefreshToken: string | undefined;
    
    const mobileUser = {
      email: `mobile.header.${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    it('should register user for mobile client type test', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(mobileUser)
        .expect(201);
    });

    it('should login with X-Client-Type: mobile header and return tokens in body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Client-Type', 'mobile')
        .send(mobileUser)
        .expect(200);

      expectSuccessResponse<LoginResponseData>(response.body, (data) => {
        expect(data).toHaveProperty('accessToken');
        expect(data).toHaveProperty('refreshToken');
        expect(data).toHaveProperty('user');
        expect(data.user.email).toBe(mobileUser.email);
      });
      expectMobileClientResponse(response, true); // Should have CSRF skipped header
      
      mobileAccessToken = response.body.data.accessToken;
      mobileRefreshToken = response.body.data.refreshToken;
    });

    it('should refresh with X-Client-Type: mobile header and Bearer token', async () => {
      expect(mobileRefreshToken).toBeDefined();
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${mobileRefreshToken!}`)
        .set('X-Client-Type', 'mobile')
        .expect(200);

      expectSuccessResponse<RefreshResponseData>(response.body, (data) => {
        expect(data).toHaveProperty('accessToken');
        expect(data).toHaveProperty('refreshToken');
        expect(typeof data.accessToken).toBe('string');
        expect(typeof data.refreshToken).toBe('string');
      });
      expectMobileClientResponse(response, true); // Should have CSRF skipped header
    });

    it('should login without X-Client-Type header (web) and use cookies', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(mobileUser)
        .expect(200);

      expectSuccessResponse<LoginResponseData>(response.body, (data) => {
        expect(data).toHaveProperty('accessToken');
        expect(data).not.toHaveProperty('refreshToken'); // No refresh token in body for web
        expect(data).toHaveProperty('user');
        expect(data.user.email).toBe(mobileUser.email);
      });
      expectWebClientResponse(response, true); // Should have refresh cookie
    });
  });

  describe('Error handling', () => {
    it('should reject invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/mobile/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expectErrorResponse(response.body, 'UnauthorizedException');
    });

    it('should reject expired access token', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';
      
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expectErrorResponse(response.body, 'UnauthorizedException');
    });
  });
});