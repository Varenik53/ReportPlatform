import ExcelJS from "exceljs";

import type { ReportRun } from "@reportplatform/shared";

import type { ReportHandler } from "../contracts/report-handler.js";

function buildWorkbook(run: ReportRun): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ReportPlatform";
  workbook.created = new Date();

  const paramsSheet = workbook.addWorksheet("Параметры запуска");
  paramsSheet.columns = [
    { header: "Параметр", key: "key", width: 30 },
    { header: "Значение", key: "value", width: 40 },
  ];
  paramsSheet.getRow(1).font = { bold: true };

  paramsSheet.addRow({ key: "ID запуска", value: run.id });
  paramsSheet.addRow({ key: "Формат", value: run.format.toUpperCase() });
  paramsSheet.addRow({ key: "Создан", value: run.createdAt });

  for (const [key, value] of Object.entries(run.params)) {
    paramsSheet.addRow({ key, value: String(value) });
  }

  const dataSheet = workbook.addWorksheet("Продажи");
  dataSheet.columns = [
    { header: "Дата", key: "date", width: 16 },
    { header: "Товар", key: "product", width: 25 },
    { header: "Кол-во", key: "qty", width: 12 },
    { header: "Сумма (₽)", key: "amount", width: 16 },
  ];
  dataSheet.getRow(1).font = { bold: true };

  const demoRows = [
    { date: "2026-04-01", product: "Ноутбук", qty: 12, amount: 719_880 },
    { date: "2026-04-02", product: "Монитор", qty: 25, amount: 374_750 },
    { date: "2026-04-03", product: "Клавиатура", qty: 80, amount: 159_200 },
    { date: "2026-04-04", product: "Мышь", qty: 110, amount: 109_890 },
    { date: "2026-04-05", product: "Наушники", qty: 45, amount: 224_550 },
  ];

  for (const row of demoRows) {
    dataSheet.addRow(row);
  }

  const totalRow = dataSheet.addRow({
    date: "",
    product: "Итого",
    qty: demoRows.reduce((sum, r) => sum + r.qty, 0),
    amount: demoRows.reduce((sum, r) => sum + r.amount, 0),
  });
  totalRow.font = { bold: true };

  return workbook;
}

export const salesSummaryHandler: ReportHandler = {
  descriptor: {
    key: "sales-summary",
    name: "Сводка по продажам",
    description: "XLSX-отчёт с агрегированными метриками продаж за выбранный период.",
    formats: ["xlsx"],
  },

  async generate(run) {
    const workbook = buildWorkbook(run);
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      fileExtension: "xlsx",
      content: Buffer.from(buffer),
    };
  },
};
