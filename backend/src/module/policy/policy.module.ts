// backend/src/module/policy/policy.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';
import { PolicyEntity } from './entities/policy.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolicyEntity], 'piki_place_db'), // 'piki_place_db' 연결에서 Policy 엔티티 사용
  ],
  controllers: [PolicyController],
  providers: [PolicyService],
})
export class PolicyModule {}
