import type { ReportDescriptor } from "@reportplatform/shared";

const reportRegistry: ReportDescriptor[] = [
  {
    key: "sales-summary",
    name: "Sales Summary",
    description: "XLSX report with aggregated sales metrics for a selected period.",
    formats: ["xlsx"],
  },
  {
    key: "weather-brief",
    name: "Weather Brief",
    description: "PDF snapshot with external or mocked weather data and highlights.",
    formats: ["pdf"],
  },
];

export function getAvailableReports(): ReportDescriptor[] {
  return reportRegistry;
}
