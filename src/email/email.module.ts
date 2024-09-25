import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';
import { EmailController } from './email.controller';

@Module({
  imports: [ConfigModule.forRoot({isGlobal: true,})],
  providers: [EmailService],
  exports: [EmailService],
  controllers: [EmailController],
})
export class EmailModule {}