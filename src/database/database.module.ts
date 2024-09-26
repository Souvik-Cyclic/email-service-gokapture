// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailTracking } from '../email/schema/email.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
    //   host: process.env.DB_HOST,
    //   port: +process.env.DB_PORT,
    //   username: process.env.DB_USERNAME,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_DATABASE,
      url: process.env.DATABASE_URL,
      entities: [EmailTracking],
      synchronize: true, // to disable in prod
    }),
    TypeOrmModule.forFeature([EmailTracking]),
  ],
})
export class DatabaseModule {}
