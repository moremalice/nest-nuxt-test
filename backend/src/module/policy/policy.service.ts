// backend/src/module/policy/policy.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { PolicyEntity } from './entities/policy.entity';
import {
  GetTermsListDto,
  GetTermsDetailDto,
  GetPrivacyListDto,
  GetPrivacyDetailDto,
} from './dto/policy.dto';

@Injectable()
export class PolicyService {
  constructor(
    @InjectRepository(PolicyEntity, 'piki_place_db')
    private readonly policyRepository: Repository<PolicyEntity>,
    private readonly i18n: I18nService,
  ) {}

  /* ──────────────────── Terms ──────────────────── */

  async getTermsList(dto: GetTermsListDto): Promise<PolicyEntity[]> {
    const { lang = 'ko', view_type } = dto;

    const queryBuilder = this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.lang = :lang', { lang })
      .andWhere('policy.state = :state', { state: '10' })
      .orderBy('policy.change_dt', 'DESC');

    if (view_type) {
      queryBuilder.andWhere('JSON_CONTAINS(policy.view_type, :viewType)', {
        viewType: JSON.stringify({ type: view_type }),
      });
    }

    let result: PolicyEntity[];
    try {
      result = await queryBuilder.getMany();
    } catch (error) {
      console.error('Terms list query error:', error);
      throw new BadRequestException(
        this.i18n.translate('policy.TERMS_LIST_ERROR'),
      );
    }

    if (!result.length) {
      throw new NotFoundException(
        this.i18n.translate('policy.TERMS_NOT_FOUND'),
      );
    }

    return result;
  }

  async getTermsDetail(dto: GetTermsDetailDto): Promise<PolicyEntity> {
    const { idx, lang = 'ko' } = dto;

    // 유효성 검사
    if (!idx || idx <= 0) {
      throw new BadRequestException(this.i18n.translate('policy.INVALID_IDX'));
    }

    let result: PolicyEntity | null;
    try {
      result = await this.policyRepository
        .createQueryBuilder('policy')
        .where('policy.idx = :idx', { idx: Number(idx) })
        .andWhere('policy.lang = :lang', { lang })
        .andWhere('policy.state = :state', { state: '10' })
        .getOne();
    } catch (error) {
      console.error('Terms detail query error:', error);
      throw new BadRequestException(
        this.i18n.translate('policy.TERMS_DETAIL_ERROR'),
      );
    }

    if (!result) {
      throw new NotFoundException(
        this.i18n.translate('policy.TERMS_DETAIL_NOT_FOUND'),
      );
    }

    return result;
  }

  /* ──────────────────── Privacy ──────────────────── */

  async getPrivacyList(dto: GetPrivacyListDto): Promise<PolicyEntity[]> {
    const { lang = 'ko', view_type } = dto;

    const queryBuilder = this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.lang = :lang', { lang })
      .andWhere('policy.state = :state', { state: '20' })
      .orderBy('policy.change_dt', 'DESC');

    if (view_type) {
      queryBuilder.andWhere('JSON_CONTAINS(policy.view_type, :viewType)', {
        viewType: JSON.stringify({ type: view_type }),
      });
    }

    let result: PolicyEntity[];
    try {
      result = await queryBuilder.getMany();
    } catch (error) {
      console.error('Privacy list query error:', error);
      throw new BadRequestException(
        this.i18n.translate('policy.PRIVACY_LIST_ERROR'),
      );
    }

    if (!result.length) {
      throw new NotFoundException(
        this.i18n.translate('policy.PRIVACY_NOT_FOUND'),
      );
    }

    return result;
  }

  async getPrivacyDetail(dto: GetPrivacyDetailDto): Promise<PolicyEntity> {
    const { idx, lang = 'ko' } = dto;

    // 유효성 검사
    if (!idx || idx <= 0) {
      throw new BadRequestException(this.i18n.translate('policy.INVALID_IDX'));
    }

    let result: PolicyEntity | null;
    try {
      result = await this.policyRepository
        .createQueryBuilder('policy')
        .where('policy.idx = :idx', { idx: Number(idx) })
        .andWhere('policy.lang = :lang', { lang })
        .andWhere('policy.state = :state', { state: '20' })
        .getOne();
    } catch (error) {
      console.error('Privacy detail query error:', error);
      throw new BadRequestException(
        this.i18n.translate('policy.PRIVACY_DETAIL_ERROR'),
      );
    }

    if (!result) {
      throw new NotFoundException(
        this.i18n.translate('policy.PRIVACY_DETAIL_NOT_FOUND'),
      );
    }

    return result;
  }
}
