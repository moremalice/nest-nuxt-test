// backend/src/module/file/file.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileController } from './file.controller';

@Module({
  imports: [ConfigModule],
  controllers: [FileController],
})
export class FileModule {}
