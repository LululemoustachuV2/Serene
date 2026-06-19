import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:8100', 'http://localhost:4200', 'http://127.0.0.1:8100'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Serene API → http://localhost:${port}`);
}

void bootstrap();
