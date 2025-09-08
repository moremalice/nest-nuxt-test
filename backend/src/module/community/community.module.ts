// backend/src/module/community/community.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NoticeEntity } from './entities/notice.entity';
import { NoticeController } from './controllers/notice.controller';
import { NoticeService } from './services/notice.service';

import { FaqEntity } from './entities/faq.entity';
import { FaqController } from './controllers/faq.controller';
import { FaqService } from './services/faq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoticeEntity, FaqEntity], 'piki_place_db'),
  ],
  controllers: [NoticeController, FaqController],
  providers: [NoticeService, FaqService],
  exports: [NoticeService, FaqService],
})
export class CommunityModule {}
