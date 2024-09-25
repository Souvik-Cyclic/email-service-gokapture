import { Module } from '@nestjs/common';
import { SnsController } from './sns.controller';
import { SnsService } from './sns.service';

@Module({
  controllers: [SnsController],
  providers: [SnsService]
})
export class SnsModule {}
