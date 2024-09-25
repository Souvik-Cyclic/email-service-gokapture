import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { SnsModule } from './sns/sns.module';

@Module({
  imports: [EmailModule, SnsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
