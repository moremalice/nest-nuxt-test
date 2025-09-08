// backend/src/module/policy/entities/policy.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tbl_board_terms')
export class PolicyEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @Column('text', { nullable: true })
  contents: string;

  @Column('json', {
    nullable: true,
    comment: '[{"type":"room"},{"type":"place"},{"type":"market"}]',
  })
  view_type: any;

  @Column('varchar', {
    length: 3,
    default: '10',
    nullable: true,
    comment: '10:이용약관 / 20:개인정보 처리방침 / 30:운영정책',
  })
  state: string;

  @Column('varchar', {
    length: 5,
    default: 'ko',
    nullable: true,
  })
  lang: string;

  @Column('datetime', {
    nullable: true,
    comment: '개정일',
  })
  change_dt: Date;

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
}
