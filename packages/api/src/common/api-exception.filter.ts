import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { ApiErrorResponse } from "@reportplatform/shared";
import type { Response } from "express";

function resolveErrorMessage(exception: unknown): string {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === "string" && response.length > 0) {
      return response;
    }

    if (typeof response === "object" && response !== null && "message" in response) {
      const message = response.message;
      if (typeof message === "string") {
        return message;
      }

      if (Array.isArray(message)) {
        const firstMessage = message.find((messageItem) => typeof messageItem === "string");
        if (firstMessage) {
          return firstMessage;
        }
      }
    }

    return exception.message;
  }

  if (exception instanceof Error && exception.message) {
    return exception.message;
  }

  return "Internal server error.";
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload: ApiErrorResponse = {
      success: false,
      error: resolveErrorMessage(exception),
    };

    response.status(statusCode).json(payload);
  }
}
