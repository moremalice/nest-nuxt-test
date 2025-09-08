// backend/src/common/common.module.ts
import { Module, Global } from '@nestjs/common';
import { CommonController } from './common.controller';
import { CustomLanguageResolver } from './i18n/custom-language.resolver';
import { CommonService } from './common.service';

@Global()
@Module({
  controllers: [CommonController],
  providers: [CommonService, CustomLanguageResolver],
  exports: [CommonService, CustomLanguageResolver],
})
export class CommonModule {}
