// backend/src/module/community/entities/faq.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tbl_admin_faq')
export class FaqEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column('text', { nullable: true })
  question: string;

  @Column('text', { nullable: true })
  answer: string;

  @Column('char', {
    length: 1,
    nullable: true,
    comment: '0 : normal, 1 : hidden, 2 : delete',
  })
  state: string;

  @Column('char', { length: 5, nullable: true })
  lang: string;

  @Column('char', {
    length: 1,
    nullable: true,
    comment: '0 : piki, 1 : pikiroom, 2 : market, 3 : talk',
  })
  app: string;

  @Column('char', { length: 2, nullable: true, comment: 'category code' })
  category: string;

  @Column('int', { nullable: true })
  order: number;

  @Column('int', { nullable: true, comment: '관리자 idx' })
  adm_idx: number;

  @CreateDateColumn({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  reg_date: Date;

  @UpdateDateColumn({ type: 'datetime', nullable: true })
  modify_date: Date;
}
