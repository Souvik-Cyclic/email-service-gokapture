import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(bodyParser.text({ limit: '50mb' }));
  app.use(bodyParser.json({ limit: '50mb' })); // For JSON payloads
  app.use(bodyParser.raw({ limit: '50mb' }));
  app.use(bodyParser.text({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // For URL-encoded data
  await app.listen(3000);

}
bootstrap();
