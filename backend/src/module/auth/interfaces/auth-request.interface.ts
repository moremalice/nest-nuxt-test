// /backend/src/module/auth/interfaces/auth-request.interface.ts
import { Request } from 'express';
import { User } from '../entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface OptionalAuthRequest extends Request {
  user?: User;
}
