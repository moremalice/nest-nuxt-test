// backend/src/module/security/csrf.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { CsrfController } from './csrf.controller';
import { CsrfService } from './csrf.service';

describe('CsrfController', () => {
  let controller: CsrfController;
  let mockCsrfService: jest.Mocked<CsrfService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockCsrfServiceValue = {
      generateToken: jest.fn(),
      status: jest.fn(),
    };

    const mockConfigServiceValue = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CsrfController],
      providers: [
        {
          provide: CsrfService,
          useValue: mockCsrfServiceValue,
        },
        {
          provide: ConfigService,
          useValue: mockConfigServiceValue,
        },
      ],
    }).compile();

    controller = module.get<CsrfController>(CsrfController);
    mockCsrfService = module.get(CsrfService);
    mockConfigService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCsrfToken', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockRequest = {
        cookies: {},
      } as any;

      mockResponse = {
        cookie: jest.fn(),
      } as any;

      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'local';
        return defaultValue;
      });
    });

    it('should generate CSRF token successfully', async () => {
      const expectedToken = 'mock-csrf-token-123';
      mockCsrfService.generateToken.mockReturnValue(expectedToken);

      const result = await controller.getCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(result).toEqual({ csrfToken: expectedToken });
      expect(mockCsrfService.generateToken).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
      );
    });

    it('should set csrf-sid cookie when not present', async () => {
      const expectedToken = 'mock-csrf-token-123';
      mockCsrfService.generateToken.mockReturnValue(expectedToken);

      await controller.getCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf-sid',
        expect.any(String),
        {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000,
          secure: false,
        },
      );
    });

    it('should not set csrf-sid cookie when already present', async () => {
      const expectedToken = 'mock-csrf-token-123';
      mockCsrfService.generateToken.mockReturnValue(expectedToken);
      (mockRequest as any).cookies = { 'csrf-sid': 'existing-session-id' };

      await controller.getCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.cookie).not.toHaveBeenCalled();
    });

    it('should use production cookie settings in production environment', async () => {
      const expectedToken = 'mock-csrf-token-123';
      mockCsrfService.generateToken.mockReturnValue(expectedToken);
      mockConfigService.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'production';
        return defaultValue;
      });

      await controller.getCsrfToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf-sid',
        expect.any(String),
        {
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000,
          secure: true,
        },
      );
    });

    it('should throw InternalServerErrorException when token generation fails', async () => {
      mockCsrfService.generateToken.mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      await expect(
        controller.getCsrfToken(
          mockRequest as Request,
          mockResponse as Response,
        ),
      ).rejects.toThrow('Failed to generate CSRF Token');
    });
  });

  describe('getCsrfStatus', () => {
    it('should return CSRF status', async () => {
      const mockStatus = {
        enabled: true,
        failOpen: false,
        reason: '',
      };
      mockCsrfService.status.mockReturnValue(mockStatus);

      const result = await controller.getCsrfStatus();

      expect(result).toEqual(mockStatus);
      expect(mockCsrfService.status).toHaveBeenCalled();
    });

    it('should return disabled status with reason', async () => {
      const mockStatus = {
        enabled: false,
        failOpen: true,
        reason: 'CSRF initialization failed',
      };
      mockCsrfService.status.mockReturnValue(mockStatus);

      const result = await controller.getCsrfStatus();

      expect(result).toEqual(mockStatus);
    });
  });
});