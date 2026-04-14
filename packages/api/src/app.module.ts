import { Module } from "@nestjs/common";

import { ReportRunsController } from "./report-runs.controller.ts";
import { ReportRunsService } from "./report-runs.service.ts";
import { ReportsController } from "./reports.controller.ts";

@Module({
  controllers: [ReportsController, ReportRunsController],
  providers: [ReportRunsService],
})
export class AppModule {}
