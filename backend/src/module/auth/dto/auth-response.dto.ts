// backend/src/module/auth/dto/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
    @ApiProperty({
        example: 1,
        description: '생성된 사용자 고유 식별자'
    })
    idx: number;

    @ApiProperty({
        example: 'user@example.com',
        description: '확인을 위한 등록된 사용자 이메일'
    })
    email: string;
}

export class ProfileResponseDto {
    @ApiProperty({ example: 1, description: '사용자 고유 식별자' })
    idx: number;

    @ApiProperty({
        example: 'user@example.com',
        description: '사용자 이메일 주소',
    })
    email: string;

    @ApiProperty({ example: true, description: '계정 활성화 상태' })
    isActive: boolean;

    @ApiProperty({
        example: '2024-01-01T00:00:00.000Z',
        description: '계정 생성 날짜',
    })
    createdAt: Date;

    @ApiProperty({
        example: '2024-01-01T00:00:00.000Z',
        description: '계정 마지막 업데이트 날짜',
    })
    updatedAt: Date;
}

export class AuthResponseDto {
    @ApiProperty({ description: 'JWT Access Token' })
    accessToken: string;

    @ApiProperty({
        description: 'JWT Refresh Token (모바일 클라이언트만)',
        required: false
    })
    refreshToken?: string;

    @ApiProperty({ description: '사용자 정보' })
    user: {
        idx: number;
        email: string;
        isActive: boolean;
    };
}

export class RefreshResponseDto {
    @ApiProperty({ description: '새로운 JWT Access Token' })
    accessToken: string;

    @ApiProperty({
        description: '새로운 JWT Refresh Token (모바일 클라이언트만)',
        required: false
    })
    refreshToken?: string;

    @ApiProperty({ description: '사용자 정보' })
    user: {
        idx: number;
        email: string;
        isActive: boolean;
    };
}

export class LogoutResponseDto {
    @ApiProperty({
        description: '로그아웃 확인 메시지 (모바일 클라이언트만)',
        required: false
    })
    message?: string;

    @ApiProperty({
        description: '로그아웃 시간 (모바일 클라이언트만)',
        required: false
    })
    loggedOutAt?: string;

    @ApiProperty({
        description: '토큰 정리 지시사항 (모바일 클라이언트만)',
        required: false,
        type: () => Object
    })
    cleanup?: {
        clearTokens: boolean;
        tokenTypes: string[];
    };
}
