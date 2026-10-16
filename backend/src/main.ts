import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // En producción solo se aceptan peticiones desde tu página.
  // Sin FRONTEND_URL (tu PC) se acepta cualquier origen.
  const origenes = process.env.FRONTEND_URL?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origenes?.length ? origenes : true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const puerto = process.env.PORT ?? 3000;
  await app.listen(puerto);
  console.log(`Servidor corriendo en el puerto ${puerto}`);
}
bootstrap();