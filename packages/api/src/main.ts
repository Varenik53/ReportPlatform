import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import { parseIntEnv } from "@reportplatform/shared";
import { closeDatabasePool } from "@reportplatform/shared/server";

import { AppModule } from "./app.module.ts";
import { ApiExceptionFilter } from "./common/api-exception.filter.ts";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn"],
  });
  app.useGlobalFilters(new ApiExceptionFilter());

  app.enableShutdownHooks();

  const port = parseIntEnv(process.env.PORT, 4000);
  await app.listen(port);
  console.log(`[api] listening on http://localhost:${port}`);

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[api] ${signal} received, shutting down…`);
    await app.close();
    await closeDatabasePool();
    console.log("[api] shutdown complete");
    process.exit(0);
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

void bootstrap();
