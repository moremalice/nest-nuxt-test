import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { CsrfService } from '../src/module/security/csrf.service';
import { SmartCsrfMiddleware } from '../src/module/security/middleware/smart-csrf.middleware';

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
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      .expect(200);

    console.log('CSRF Token Response:', JSON.stringify(response.body, null, 2));
    console.log('Response Headers:', response.headers);
    
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('csrfToken');
    expect(typeof response.body.data.csrfToken).toBe('string');
    expect(response.body.data.csrfToken.length).toBeGreaterThan(0);
  });

  it('should generate CSRF status', async () => {
    const response = await request(app.getHttpServer())
      .get('/csrf/status')
      .expect(200);

    console.log('CSRF Status Response:', JSON.stringify(response.body, null, 2));
    
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('success');
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('enabled');
    expect(response.body.data).toHaveProperty('failOpen');
  });
});