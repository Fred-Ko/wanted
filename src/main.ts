import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  await app.listen(process.env.PORT);

  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception thrown:', error);
  });

  Logger.log(`[Server Start] Server is running on port ${process.env.PORT}`);
  Logger.log(`[Server Start] Database Host: ${process.env.DATABASE_HOST}`);
}
bootstrap();
