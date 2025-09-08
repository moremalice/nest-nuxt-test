// backend/src/module/community/entities/notice.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tbl_board_notice')
export class NoticeEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column('varchar', { length: 200, nullable: true })
  title: string;

  @Column('text', { nullable: true })
  contents: string;

  @Column('int', { nullable: true })
  writer_idx: number;

  @Column('json', {
    nullable: true,
    comment: '[{"type":"room"},{"type":"place"},{"type":"market"}]',
  })
  view_type: any;

  @Column('varchar', {
    length: 3,
    default: 'N',
    nullable: true,
    comment: 'Y/N',
  })
  is_html: string;

  @Column('int', { nullable: true })
  file_idx: number;

  @Column('varchar', {
    length: 3,
    default: '10',
    nullable: true,
    comment: '10:일반, 20:정지(숨김), 30:삭제',
  })
  state: string;

  @Column('varchar', {
    length: 200,
    default: '',
    nullable: true,
  })
  link: string;

  @Column('varchar', {
    length: 20,
    default: 'link',
    nullable: true,
    comment: 'link, event, vote, none, piki_room, piki_room_shop',
  })
  target: string;

  @Column('int', { nullable: true })
  target_idx: number;

  @Column('varchar', {
    length: 5,
    default: 'KR',
    nullable: true,
  })
  lang: string;

  @Column('datetime', { nullable: true })
  notice_start_dt: Date;

  @Column('datetime', { nullable: true })
  notice_end_dt: Date;

  @CreateDateColumn({
    name: 'reg_dt',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  reg_dt: Date;

  @UpdateDateColumn({
    name: 'modify_dt',
    type: 'datetime',
    nullable: true,
  })
  modify_dt: Date;

  @Column('varchar', {
    length: 10,
    default: 'notice',
    nullable: true,
    comment: '테이블 명',
  })
  t_name: string;

  @Column('char', {
    nullable: true,
    comment: '상위노출(Y:상위노출/N:상위비노출)',
  })
  is_top: string;
}
