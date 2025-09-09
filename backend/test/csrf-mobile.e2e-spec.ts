// /backend/test/csrf-mobile.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { CsrfService } from '../src/module/security/csrf.service';

describe('CSRF Mobile Client Bypass (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same middleware setup as in main.ts
    const configService = app.get(ConfigService);
    const csrfService = app.get(CsrfService);
    
    // Cookie parser is needed for CSRF
    app.use(require('cookie-parser')());
    
    // CSRF protection with mobile client detection
    app.use((req: any, res: any, next: any) => {
      // Skip CSRF for mobile clients
      if (csrfService.shouldSkipCsrf(req)) {
        res.setHeader('X-CSRF-Skipped', 'mobile-client');
        return next();
      }
      
      // Apply CSRF protection for web clients
      const protection = csrfService.protection;
      protection(req, res, next);
    });
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CSRF validation for different client types', () => {
    const testUser = {
      email: `csrf.test.${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    it('should skip CSRF validation for mobile clients with X-Client-Type header', async () => {
      // Register without CSRF token but with mobile header
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .set('X-Client-Type', 'mobile')
        .send(testUser)
        .expect(201);

      expect(response.headers['x-csrf-skipped']).toBe('mobile-client');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });

    it('should skip CSRF validation for React Native user agent', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'MyApp/1.0 (React-Native)')
        .send(testUser)
        .expect(200);

      expect(response.headers['x-csrf-skipped']).toBe('mobile-client');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });

    it('should skip CSRF validation for Flutter app user agent', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'Flutter/2.0 android-app')
        .send(testUser)
        .expect(200);

      expect(response.headers['x-csrf-skipped']).toBe('mobile-client');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });

    it('should skip CSRF validation for OkHttp client (Android)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'okhttp/4.9.0')
        .send(testUser)
        .expect(200);

      expect(response.headers['x-csrf-skipped']).toBe('mobile-client');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });

    it('should require CSRF token for web browsers', async () => {
      // First, get CSRF token
      const tokenResponse = await request(app.getHttpServer())
        .get('/csrf/token')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0')
        .expect(200);

      const csrfToken = tokenResponse.body.data.csrfToken;

      // Register new user for web test
      const webUser = {
        email: `web.csrf.${Date.now()}@example.com`,
        password: 'TestPassword123!',
      };

      // Try without CSRF token - should fail
      await request(app.getHttpServer())
        .post('/auth/register')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0')
        .send(webUser)
        .expect(403); // CSRF validation should fail

      // Try with CSRF token - should succeed
      const successResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0')
        .set('X-CSRF-Token', csrfToken)
        .send(webUser)
        .expect(201);

      expect(successResponse.body.status).toBe('success');
      expect(successResponse.headers['x-csrf-skipped']).toBeUndefined();
    });

    it('should handle mixed client type correctly', async () => {
      // Mobile client with browser-like user agent but X-Client-Type header
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)')
        .set('X-Client-Type', 'mobile') // This takes priority
        .send(testUser)
        .expect(200);

      expect(response.headers['x-csrf-skipped']).toBe('mobile-client');
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeDefined();
    });
  });

  describe('CSRF token endpoint behavior', () => {
    it('should still generate CSRF token for mobile clients if requested', async () => {
      const response = await request(app.getHttpServer())
        .get('/csrf/token')
        .set('X-Client-Type', 'mobile')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.csrfToken).toBeDefined();
      // Mobile clients can get token but it won't be validated
    });

    it('should provide CSRF status endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/csrf/status')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.enabled).toBeDefined();
      expect(response.body.data.failOpen).toBeDefined();
    });
  });
});