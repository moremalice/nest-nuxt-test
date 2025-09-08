// backend/src/module/auth/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // 선택적 인증: 토큰이 없거나 유효하지 않아도 통과시키되, user는 undefined로 설정
    if (err || !user) {
      return null;
    }
    return user;
  }
}
