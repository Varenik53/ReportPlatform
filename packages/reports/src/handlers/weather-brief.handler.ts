import type { ReportHandler } from "../contracts/report-handler.js";
import { buildStubReportContent } from "../services/stub-report-content.service.js";

export const weatherBriefHandler: ReportHandler = {
  descriptor: {
    key: "weather-brief",
    name: "Weather Brief",
    description: "PDF snapshot with external or mocked weather data and highlights.",
    formats: ["pdf"],
  },
  generate(run) {
    return Promise.resolve({
      fileExtension: "pdf",
      content: buildStubReportContent("Weather Brief", run),
    });
  },
};
