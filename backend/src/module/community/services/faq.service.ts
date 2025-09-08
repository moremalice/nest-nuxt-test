// backend/src/module/community/services/faq.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import { FaqEntity } from '../entities/faq.entity';
import { GetFaqListDto } from '../dto/faq.dto';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(FaqEntity, 'piki_place_db')
    private readonly faqRepository: Repository<FaqEntity>,
    private readonly i18n: I18nService,
  ) {}

  async getFaqList(dto: GetFaqListDto) {
    const { lang = 'ko' } = dto;

    try {
      const faqList = await this.faqRepository
        .createQueryBuilder('faq')
        .where('faq.state = :state', { state: '0' })
        .andWhere('faq.app = :app', { app: '3' })
        .andWhere('faq.lang = :lang', { lang })
        .orderBy('faq.order', 'ASC')
        .getMany();

      return {
        faq_list: faqList,
      };
    } catch (error) {
      console.error('FAQ list query error:', error);
      throw new BadRequestException(
        this.i18n.translate('community.FAQ_LIST_ERROR'),
      );
    }
  }
}
