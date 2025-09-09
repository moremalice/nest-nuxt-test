// backend/test/test-helpers.ts

// Standard response type interfaces
export interface StandardSuccessResponse<T = any> {
  status: 'success';
  data: T;
}

export interface StandardErrorResponse {
  status: 'error';
  data: {
    name: string;
    message: string;
  };
}

export type StandardApiResponse<T = any> = StandardSuccessResponse<T> | StandardErrorResponse;

// Response validation helper functions
export const expectSuccessResponse: <T = any>(
  responseBody: any,
  dataValidator?: (data: T) => void
) => asserts responseBody is StandardSuccessResponse<T> = <T = any>(
  responseBody: any,
  dataValidator?: (data: T) => void
): asserts responseBody is StandardSuccessResponse<T> => {
  expect(responseBody).toHaveProperty('status');
  expect(responseBody.status).toBe('success');
  expect(responseBody).toHaveProperty('data');
  
  if (dataValidator && responseBody.data) {
    dataValidator(responseBody.data);
  }
};

export const expectErrorResponse: (
  responseBody: any,
  expectedErrorName?: string,
  expectedMessageContains?: string
) => asserts responseBody is StandardErrorResponse = (
  responseBody: any,
  expectedErrorName?: string,
  expectedMessageContains?: string
): asserts responseBody is StandardErrorResponse => {
  expect(responseBody).toHaveProperty('status');
  expect(responseBody.status).toBe('error');
  expect(responseBody).toHaveProperty('data');
  expect(responseBody.data).toHaveProperty('name');
  expect(responseBody.data).toHaveProperty('message');
  expect(typeof responseBody.data.name).toBe('string');
  expect(typeof responseBody.data.message).toBe('string');
  
  if (expectedErrorName) {
    expect(responseBody.data.name).toBe(expectedErrorName);
  }
  
  if (expectedMessageContains) {
    expect(responseBody.data.message).toContain(expectedMessageContains);
  }
};

// CSRF token response type
export interface CsrfTokenData {
  csrfToken: string;
}

// Auth response types
export interface UserData {
  idx: number;
  email: string;
  isActive?: boolean;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken?: string; // Only for mobile clients
  user: UserData;
}

export interface RefreshResponseData {
  accessToken: string;
  refreshToken?: string; // Only for mobile clients
}

// CSRF status response type
export interface CsrfStatusData {
  enabled: boolean;
  failOpen: boolean;
  reason?: string;
}

// Client type validation helpers
export const expectWebClientResponse: (
  response: any,
  shouldHaveRefreshCookie?: boolean
) => void = (
  response: any,
  shouldHaveRefreshCookie: boolean = false
): void => {
  if (shouldHaveRefreshCookie) {
    expect(response.headers['set-cookie']).toBeDefined();
    const cookies = Array.isArray(response.headers['set-cookie']) 
      ? response.headers['set-cookie'] 
      : [response.headers['set-cookie']];
    expect(cookies.some((cookie: string) => 
      cookie.includes('ref_token_')
    )).toBe(true);
  }
  
  // Web clients should not have CSRF skipped header
  expect(response.headers['x-csrf-skipped']).toBeUndefined();
};

export const expectMobileClientResponse: (
  response: any,
  shouldHaveCsrfSkipped?: boolean
) => void = (
  response: any,
  shouldHaveCsrfSkipped: boolean = true
): void => {
  // Mobile clients should not have refresh cookies
  const cookies = response.headers['set-cookie'];
  if (cookies) {
    const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
    expect(cookieArray.some((cookie: string) => 
      cookie.includes('ref_token_')
    )).toBe(false);
  }
  
  if (shouldHaveCsrfSkipped) {
    expect(response.headers['x-csrf-skipped']).toBe('mobile-client');
  }
};

// Test data generators
export const generateTestUser: (suffix?: string) => { email: string; password: string } = (suffix?: string) => ({
  email: `test${suffix ? `.${suffix}` : ''}.${Date.now()}@example.com`,
  password: 'TestPassword123!',
});

export const generateWebUserAgent: () => string = (): string => 
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

export const generateMobileUserAgent: () => string = (): string => 
  'MyApp/1.0 (React-Native)';