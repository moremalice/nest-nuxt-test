// /backend/src/common/guards/proxy-aware-throttler.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return (Array.isArray(req.ips) && req.ips[0]) || req.ip || req.hostname;
  }
}
