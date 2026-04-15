import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { parseIntEnv } from "@reportplatform/shared";

import { AppModule } from "./app.module.ts";
import { ApiExceptionFilter } from "./common/api-exception.filter.ts";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn"],
  });
  app.useGlobalFilters(new ApiExceptionFilter());

  const port = parseIntEnv(process.env.PORT, 4000);
  await app.listen(port);
  console.log(`[api] listening on http://localhost:${port}`);
}

void bootstrap();
