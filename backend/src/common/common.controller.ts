// backend/src/common/common.controller.ts
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('WEB')
@Controller('common')
export class CommonController {
  constructor(private readonly configService: ConfigService) {}
}
