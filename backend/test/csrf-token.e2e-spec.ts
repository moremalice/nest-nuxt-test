import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { CsrfService } from '../src/module/security/csrf.service';
import { SmartCsrfMiddleware } from '../src/module/security/middleware/smart-csrf.middleware';
import {
  expectSuccessResponse,
  CsrfTokenData,
  CsrfStatusData,
  generateWebUserAgent
} from './test-helpers';

describe('CSRF Token (e2e)', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Setup cookie parser and CSRF middleware like in main.ts
    app.use(cookieParser());
    
    // Get CSRF service and apply middleware
    const csrfService = app.get(CsrfService);
    const smartCsrfMiddleware = new SmartCsrfMiddleware(csrfService);
    app.use(smartCsrfMiddleware.use.bind(smartCsrfMiddleware));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate CSRF token for web browsers', async () => {
    const response = await request(app.getHttpServer())
      .get('/csrf/token')
      .set('User-Agent', generateWebUserAgent())
      .expect(200);

    console.log('CSRF Token Response:', JSON.stringify(response.body, null, 2));
    console.log('Response Headers:', response.headers);
    
    expectSuccessResponse<CsrfTokenData>(response.body, (data) => {
      expect(data).toHaveProperty('csrfToken');
      expect(typeof data.csrfToken).toBe('string');
      expect(data.csrfToken.length).toBeGreaterThan(0);
      expect(data.csrfToken).toMatch(/^[a-f0-9]{64}\.[a-f0-9]+$/); // CSRF token format validation
    });
    
    // Check that CSRF session cookie is set
    expect(response.headers['set-cookie']).toBeDefined();
    const cookies = Array.isArray(response.headers['set-cookie']) 
      ? response.headers['set-cookie'] 
      : [response.headers['set-cookie']];
    expect(cookies.some(cookie => cookie.includes('csrf-sid'))).toBe(true);
  });

  it('should generate CSRF status', async () => {
    const response = await request(app.getHttpServer())
      .get('/csrf/status')
      .expect(200);

    console.log('CSRF Status Response:', JSON.stringify(response.body, null, 2));
    
    expectSuccessResponse<CsrfStatusData>(response.body, (data) => {
      expect(data).toHaveProperty('enabled');
      expect(data).toHaveProperty('failOpen');
      expect(typeof data.enabled).toBe('boolean');
      expect(typeof data.failOpen).toBe('boolean');
      expect(data.enabled).toBe(true); // CSRF should be enabled in tests
      if (data.reason) {
        expect(typeof data.reason).toBe('string');
      }
    });
  });
});