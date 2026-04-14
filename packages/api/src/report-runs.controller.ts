import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
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
import type { ApiSuccessResponse, ReportRun } from "@reportplatform/shared";
import type { Response } from "express";

import { ReportRunsService } from "./report-runs.service.ts";

function buildDownloadPath(storageDir: string, relativeFilePath: string): string | null {
  const rootDirectory = resolve(storageDir);
  const targetPath = resolve(rootDirectory, relativeFilePath);
  const hasValidPrefix =
    targetPath === rootDirectory || targetPath.startsWith(`${rootDirectory}${sep}`);

  if (!hasValidPrefix) {
    return null;
  }

  return targetPath;
}

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
      throw new InternalServerErrorException("Failed to list report runs.");
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRun(@Body() payload: unknown): Promise<ApiSuccessResponse<ReportRun>> {
    const parsedPayload = this.reportRunsService.parseCreateRunPayload(payload);
    if (!parsedPayload) {
      throw new BadRequestException("Body must include reportKey, format and params object.");
    }

    if (!this.reportRunsService.isKnownReport(parsedPayload.reportKey)) {
      throw new BadRequestException("Unknown report key.");
    }

    if (!this.reportRunsService.isFormatSupported(parsedPayload.reportKey, parsedPayload.format)) {
      throw new BadRequestException("Format is not supported for selected report.");
    }

    try {
      const run = await this.reportRunsService.createRun(parsedPayload);
      return {
        success: true,
        data: run,
      };
    } catch (error) {
      console.error("[api] failed to create report run", error);
      throw new InternalServerErrorException("Failed to create report run.");
    }
  }

  @Get(":id")
  async getRunById(@Param("id") runId: string): Promise<ApiSuccessResponse<ReportRun>> {
    try {
      const run = await this.reportRunsService.getRunById(runId);
      if (!run) {
        throw new NotFoundException("Report run not found.");
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
      throw new InternalServerErrorException("Failed to fetch report run.");
    }
  }

  @Get(":id/download")
  async downloadRunResult(@Param("id") runId: string, @Res() response: Response): Promise<void> {
    try {
      const run = await this.reportRunsService.getRunById(runId);
      if (!run) {
        throw new NotFoundException("Report run not found.");
      }

      if (run.status !== "succeeded" || !run.filePath || !run.fileName) {
        throw new ConflictException("Report file is not ready yet.");
      }

      const storageDir = process.env.STORAGE_DIR;
      if (!storageDir) {
        throw new InternalServerErrorException("STORAGE_DIR is not configured.");
      }

      const resolvedFilePath = buildDownloadPath(storageDir, run.filePath);
      if (!resolvedFilePath) {
        throw new BadRequestException("Invalid file path.");
      }

      try {
        await access(resolvedFilePath);
      } catch {
        throw new NotFoundException("Generated file not found.");
      }

      const contentType =
        run.format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      response.setHeader("content-type", contentType);
      response.setHeader("content-disposition", `attachment; filename="${basename(run.fileName)}"`);

      const stream = createReadStream(resolvedFilePath);
      stream.on("error", (error) => {
        console.error("[api] failed to stream report file", error);
        if (!response.headersSent) {
          response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: "Failed to stream generated file.",
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
      throw new InternalServerErrorException("Failed to download report file.");
    }
  }
}
