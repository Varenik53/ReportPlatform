import { fileURLToPath } from "node:url";

import PDFDocument from "pdfkit";

import type { ReportRun } from "@reportplatform/shared";

import type { ReportHandler } from "../contracts/report-handler.js";

/** PDFKit built-ins (Helvetica) do not cover Cyrillic; embed Noto Sans TTF. */
const FONT_REGULAR = fileURLToPath(
  new URL("../../assets/fonts/NotoSans-Regular.ttf", import.meta.url),
);
const FONT_BOLD = fileURLToPath(new URL("../../assets/fonts/NotoSans-Bold.ttf", import.meta.url));

const FONT_SIZE_TITLE = 20;
const FONT_SIZE_HEADING = 14;
const FONT_SIZE_BODY = 11;

function collectPdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

interface WeatherRow {
  city: string;
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
}

const DEMO_WEATHER: WeatherRow[] = [
  { city: "Москва", temp: "+14 °C", condition: "Облачно", humidity: "62%", wind: "4 м/с" },
  { city: "Санкт-Петербург", temp: "+11 °C", condition: "Дождь", humidity: "78%", wind: "6 м/с" },
  { city: "Новосибирск", temp: "+8 °C", condition: "Ясно", humidity: "45%", wind: "3 м/с" },
  {
    city: "Екатеринбург",
    temp: "+10 °C",
    condition: "Переменная облачность",
    humidity: "55%",
    wind: "5 м/с",
  },
  { city: "Казань", temp: "+12 °C", condition: "Ясно", humidity: "50%", wind: "2 м/с" },
];

function buildPdf(run: ReportRun): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.registerFont("ReportBody", FONT_REGULAR);
  doc.registerFont("ReportBold", FONT_BOLD);
  doc.font("ReportBody");

  doc.fontSize(FONT_SIZE_TITLE).text("Сводка по погоде", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(FONT_SIZE_BODY).text(`ID запуска: ${run.id}`, { align: "center" });
  doc.text(`Создан: ${run.createdAt}`, { align: "center" });
  doc.moveDown(1);

  const paramEntries = Object.entries(run.params);
  if (paramEntries.length > 0) {
    doc.fontSize(FONT_SIZE_HEADING).text("Параметры запуска");
    doc.moveDown(0.3);
    doc.fontSize(FONT_SIZE_BODY);
    for (const [key, value] of paramEntries) {
      doc.text(`${key}: ${value}`);
    }
    doc.moveDown(1);
  }

  doc.fontSize(FONT_SIZE_HEADING).text("Данные о погоде (демо)");
  doc.moveDown(0.5);

  const colX = [50, 180, 240, 380, 450];
  const headers = ["Город", "Темп.", "Состояние", "Влажн.", "Ветер"];

  doc.fontSize(FONT_SIZE_BODY).font("ReportBold");
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], colX[i], doc.y, { continued: i < headers.length - 1, width: 120 });
  }
  doc.moveDown(0.5);
  doc.font("ReportBody");

  for (const row of DEMO_WEATHER) {
    const y = doc.y;
    const values = [row.city, row.temp, row.condition, row.humidity, row.wind];
    for (let i = 0; i < values.length; i++) {
      doc.text(values[i], colX[i], y, { width: 120 });
    }
    doc.moveDown(0.3);
  }

  doc.moveDown(1.5);
  doc
    .font("ReportBody")
    .fontSize(9)
    .fillColor("#888")
    .text("Сгенерировано ReportPlatform (MVP-демо)", {
      align: "center",
    });

  return doc;
}

export const weatherBriefHandler: ReportHandler = {
  descriptor: {
    key: "weather-brief",
    name: "Сводка по погоде",
    description: "PDF-отчёт с данными о погоде из внешнего или демо-источника.",
    formats: ["pdf"],
  },

  async generate(run) {
    const doc = buildPdf(run);
    const buffer = await collectPdfBuffer(doc);

    return {
      fileExtension: "pdf",
      content: buffer,
    };
  },
};
