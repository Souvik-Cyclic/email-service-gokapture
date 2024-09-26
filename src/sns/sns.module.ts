import { Module } from '@nestjs/common';
import { SnsController } from './sns.controller';
import { SnsService } from './sns.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [SnsController],
  providers: [SnsService]
})
export class SnsModule {}
