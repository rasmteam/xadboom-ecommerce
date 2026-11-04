import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // behind Hamravesh / Caddy: trust the first proxy so req.ip and secure cookies work
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix("api");
  app.enableShutdownHooks();

  const docs = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle("Xadboom API").setVersion("0.1").addCookieAuth("xb_session").build(),
  );
  SwaggerModule.setup("api/docs", app, docs);

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  console.log(`Xadboom API listening on :${port} (docs: /api/docs)`);
}

bootstrap();
