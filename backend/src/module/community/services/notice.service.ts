// backend/src/module/community/services/notice.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CommonService } from '../../../common/common.service';
import { NoticeEntity } from '../entities/notice.entity';
import { GetNoticeListDto, GetNoticeDetailDto } from '../dto/notice.dto';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(NoticeEntity, 'piki_place_db')
    private readonly noticeRepository: Repository<NoticeEntity>,
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
  ) {}

  async getNoticeList(dto: GetNoticeListDto) {
    const { word, offset, current_page, lang } = dto;

    if (typeof word === 'string' && word.length < 2) {
      return {
        notice_list: [],
        notice_cnt: 0,
        offset,
        current_page,
        total_pages: 0,
      };
    }

    const skip = (current_page - 1) * offset;
    const queryBuilder = this.noticeRepository
      .createQueryBuilder('tbe')
      .select('tbe.title', 'title')
      .addSelect('tbe.idx', 'idx')
      .addSelect('tbe.link', 'link')
      .addSelect('tbe.is_html', 'is_html')
      .addSelect('UNIX_TIMESTAMP(tbe.reg_dt)', 'reg_stamp')
      .addSelect(
        'IF(tbe.reg_dt >= NOW() - INTERVAL 24 HOUR, "O", "X")',
        'is_new',
      )
      .addSelect('tbe.is_top', 'is_top')
      .where(
        'JSON_SEARCH(LOWER(JSON_EXTRACT(tbe.view_type, "$[*].type")), "one", LOWER("talk")) IS NOT NULL',
      )
      .andWhere('tbe.lang = :lang', { lang })
      .andWhere('tbe.state = :state', { state: '10' });

    if (word) {
      const pattern = this.commonService.toLikeContainsPattern(word);
      queryBuilder.andWhere(
        `tbe.title LIKE :word ESCAPE '${this.commonService.LIKE_ESCAPE_CHAR}'`,
        { word: pattern },
      );
    }

    queryBuilder
      .addOrderBy('IF(tbe.is_top = "Y", 0, 1)', 'ASC')
      .addOrderBy('tbe.reg_dt', 'DESC');

    let noticeList: any[];
    let totalCount: number;

    try {
      [noticeList, totalCount] = await Promise.all([
        queryBuilder.offset(skip).limit(offset).getRawMany(),
        this.getNoticeCount(dto),
      ]);
    } catch (error) {
      console.error('Notice list query error:', error);
      throw new BadRequestException(
        this.i18n.translate('community.NOTICE_LIST_ERROR'),
      );
    }

    return {
      notice_list: noticeList,
      notice_cnt: totalCount,
      offset: offset,
      current_page: current_page,
      total_pages: Math.ceil(totalCount / offset),
    };
  }

  async getNoticeCount(dto: GetNoticeListDto): Promise<number> {
    const { word, lang } = dto;

    if (typeof word === 'string' && word.length < 2) {
      return 0;
    }

    const queryBuilder = this.noticeRepository
      .createQueryBuilder('tbe')
      .select('COUNT(*)', 'cnt')
      .where(
        'JSON_SEARCH(LOWER(JSON_EXTRACT(tbe.view_type, "$[*].type")), "one", LOWER("talk")) IS NOT NULL',
      )
      .andWhere('tbe.lang = :lang', { lang })
      .andWhere('tbe.state = :state', { state: '10' });

    if (word) {
      const pattern = this.commonService.toLikeContainsPattern(word);
      queryBuilder.andWhere(
        `tbe.title LIKE :word ESCAPE '${this.commonService.LIKE_ESCAPE_CHAR}'`,
        { word: pattern },
      );
    }

    try {
      const result = await queryBuilder.getRawOne();
      return parseInt(result.cnt) || 0;
    } catch (error) {
      console.error('Notice count query error:', error);
      throw new BadRequestException(
        this.i18n.translate('community.NOTICE_COUNT_ERROR'),
      );
    }
  }

  async getNoticeDetail(dto: GetNoticeDetailDto) {
    const { idx, lang } = dto;

    const fileDomain = this.configService.get<string>('PIKI_DOMAIN');
    const fileDataPath = this.configService.get<string>('FILE_DATA_PATH');

    let notice: any;
    let prevNotice: any;
    let nextNotice: any;

    // 현재 공지사항 조회
    try {
      notice = await this.noticeRepository
        .createQueryBuilder('tbe')
        .leftJoin('tbl_uploads', 'tu', 'tbe.file_idx = tu.file_idx')
        .select('tbe.idx', 'idx')
        .addSelect('tbe.title', 'title')
        .addSelect('tbe.contents', 'contents')
        .addSelect('tbe.is_html', 'is_html')
        .addSelect('tbe.file_idx', 'file_idx')
        .addSelect('tbe.link', 'link')
        .addSelect('tbe.target', 'target')
        .addSelect('tbe.target_idx', 'target_idx')
        .addSelect('tbe.reg_dt', 'reg_dt')
        .addSelect('UNIX_TIMESTAMP(tbe.reg_dt)', 'reg_stamp')
        .addSelect('tu.filepath_resize', 'file_path_resize')
        .addSelect('tu.name_origin', 'name_origin')
        .addSelect('tu.filepath', 'file_path')
        .addSelect(
          `CASE WHEN tu.filepath_resize IS NOT NULL THEN CONCAT('${fileDomain}', '${fileDataPath}', tu.filepath_resize) ELSE NULL END`,
          'full_file_path_resize',
        )
        .addSelect(
          `CASE WHEN tu.filepath IS NOT NULL THEN CONCAT('${fileDomain}', '${fileDataPath}', tu.filepath) ELSE NULL END`,
          'full_file_path',
        )
        .addSelect(
          'IF(tbe.reg_dt >= NOW() - INTERVAL 24 HOUR, "O", "X")',
          'is_new',
        )
        .where('tbe.idx = :idx', { idx })
        .andWhere(
          'JSON_SEARCH(LOWER(JSON_EXTRACT(tbe.view_type, "$[*].type")), "one", LOWER("talk")) IS NOT NULL',
        )
        .andWhere('tbe.lang = :lang', { lang })
        .andWhere('tbe.state = :state', { state: '10' })
        .getRawOne();
    } catch (error) {
      console.error('Notice detail query error:', error);
      throw new BadRequestException(
        this.i18n.translate('community.NOTICE_DETAIL_ERROR'),
      );
    }

    if (!notice) {
      throw new NotFoundException(
        this.i18n.translate('community.NOTICE_NOT_FOUND'),
      );
    }

    // 이전/다음 공지사항 조회를 병렬로 처리
    try {
      [prevNotice, nextNotice] = await Promise.all([
        // 이전 공지사항 조회 (현재 글보다 작은 idx 중 가장 큰 값)
        this.noticeRepository
          .createQueryBuilder('tbe')
          .select('tbe.idx', 'idx')
          .addSelect('tbe.title', 'title')
          .where('tbe.idx < :idx', { idx })
          .andWhere(
            'JSON_SEARCH(LOWER(JSON_EXTRACT(tbe.view_type, "$[*].type")), "one", LOWER("talk")) IS NOT NULL',
          )
          .andWhere('tbe.lang = :lang', { lang })
          .andWhere('tbe.state = :state', { state: '10' })
          .orderBy('tbe.idx', 'DESC')
          .limit(1)
          .getRawOne(),

        // 다음 공지사항 조회 (현재 글보다 큰 idx 중 가장 작은 값)
        this.noticeRepository
          .createQueryBuilder('tbe')
          .select('tbe.idx', 'idx')
          .addSelect('tbe.title', 'title')
          .where('tbe.idx > :idx', { idx })
          .andWhere(
            'JSON_SEARCH(LOWER(JSON_EXTRACT(tbe.view_type, "$[*].type")), "one", LOWER("talk")) IS NOT NULL',
          )
          .andWhere('tbe.lang = :lang', { lang })
          .andWhere('tbe.state = :state', { state: '10' })
          .orderBy('tbe.idx', 'ASC')
          .limit(1)
          .getRawOne(),
      ]);
    } catch (error) {
      console.error('Previous/Next notice query error:', error);
      prevNotice = null;
      nextNotice = null;
    }

    return {
      ...notice,
      prev_idx: prevNotice?.idx || null,
      prev_title: prevNotice?.title || null,
      next_idx: nextNotice?.idx || null,
      next_title: nextNotice?.title || null,
    };
  }
}
