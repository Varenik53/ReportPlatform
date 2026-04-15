import { createReadStream } from "node:fs";
import { basename } from "node:path";

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Res,
} from "@nestjs/common";
import {
  REPORT_FORMAT_META,
  REPORT_RUN_STATUS,
  type ApiSuccessResponse,
  type ReportRun,
} from "@reportplatform/shared";
import {
  resolveExistingArtifactPath,
  resolveStorageDirectory,
} from "@reportplatform/shared/server";
import type { Response } from "express";

import { ReportRunsService } from "./report-runs.service.ts";

@Controller("report-runs")
export class ReportRunsController {
  constructor(
    @Inject(ReportRunsService)
    private readonly reportRunsService: ReportRunsService,
  ) {}

  @Get()
  async getRuns(): Promise<ApiSuccessResponse<{ runs: ReportRun[] }>> {
    try {
      const runs = await this.reportRunsService.getRuns();
      return {
        success: true,
        data: { runs },
      };
    } catch (error) {
      console.error("[api] failed to list report runs", error);
      throw new InternalServerErrorException("Не удалось получить список запусков.");
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRun(@Body() payload: unknown): Promise<ApiSuccessResponse<ReportRun>> {
    const parsedPayload = this.reportRunsService.parseCreateRunPayload(payload);
    if (!parsedPayload) {
      throw new BadRequestException(
        "Тело запроса должно содержать reportKey, format и объект params.",
      );
    }

    if (!this.reportRunsService.isKnownReport(parsedPayload.reportKey)) {
      throw new BadRequestException("Неизвестный ключ отчёта.");
    }

    if (!this.reportRunsService.isFormatSupported(parsedPayload.reportKey, parsedPayload.format)) {
      throw new BadRequestException("Формат не поддерживается для выбранного отчёта.");
    }

    try {
      const run = await this.reportRunsService.createRun(parsedPayload);
      return {
        success: true,
        data: run,
      };
    } catch (error) {
      console.error("[api] failed to create report run", error);
      throw new InternalServerErrorException("Не удалось создать запуск отчёта.");
    }
  }

  @Get(":id")
  async getRunById(@Param("id") runId: string): Promise<ApiSuccessResponse<ReportRun>> {
    try {
      const run = await this.reportRunsService.getRunById(runId);
      if (!run) {
        throw new NotFoundException("Запуск отчёта не найден.");
      }

      return {
        success: true,
        data: run,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error("[api] failed to fetch report run", error);
      throw new InternalServerErrorException("Не удалось получить запуск отчёта.");
    }
  }

  @Get(":id/download")
  async downloadRunResult(@Param("id") runId: string, @Res() response: Response): Promise<void> {
    try {
      const run = await this.reportRunsService.getRunById(runId);
      if (!run) {
        throw new NotFoundException("Запуск отчёта не найден.");
      }

      if (run.status !== REPORT_RUN_STATUS.Succeeded || !run.filePath || !run.fileName) {
        throw new ConflictException("Файл отчёта ещё не готов.");
      }

      const resolvedFilePath = await resolveExistingArtifactPath(run.filePath);
      if (!resolvedFilePath) {
        throw new NotFoundException("Сгенерированный файл не найден.");
      }

      const contentType = REPORT_FORMAT_META[run.format].mimeType;

      response.setHeader("content-type", contentType);
      response.setHeader("content-disposition", `attachment; filename="${basename(run.fileName)}"`);

      const stream = createReadStream(resolvedFilePath);
      stream.on("error", (error) => {
        console.error("[api] failed to stream report file", error);
        if (!response.headersSent) {
          response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: "Не удалось передать сгенерированный файл.",
          });
          return;
        }

        response.destroy(error);
      });
      stream.pipe(response);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      console.error("[api] failed to download report run file", error);
      throw new InternalServerErrorException("Не удалось скачать файл отчёта.");
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRun(@Param("id") runId: string): Promise<void> {
    const storageDir = resolveStorageDirectory();

    try {
      const deleted = await this.reportRunsService.deleteRun(runId, storageDir);
      if (!deleted) {
        throw new NotFoundException("Запуск отчёта не найден.");
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error("[api] failed to delete report run", error);
      throw new InternalServerErrorException("Не удалось удалить запуск отчёта.");
    }
  }
}
