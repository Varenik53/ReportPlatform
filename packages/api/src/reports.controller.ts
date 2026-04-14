import { Controller, Get } from "@nestjs/common";
import { getAvailableReports } from "@reportplatform/reports";
import type { ApiSuccessResponse } from "@reportplatform/shared";

@Controller()
export class ReportsController {
  @Get("health")
  getHealth(): ApiSuccessResponse<{ status: "ok"; service: "api" }> {
    return {
      success: true,
      data: { status: "ok", service: "api" },
    };
  }

  @Get("reports")
  getReports(): ApiSuccessResponse<{ reports: ReturnType<typeof getAvailableReports> }> {
    return {
      success: true,
      data: { reports: getAvailableReports() },
    };
  }
}
