import { isRecord } from "@reportplatform/shared";

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

export async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, init);

  if (!response.ok) {
    let serverMessage: string | undefined;
    try {
      const body: unknown = await response.json();
      if (isRecord(body) && typeof body.error === "string" && body.error.length > 0) {
        serverMessage = body.error;
      }
    } catch {
      /* response body is not JSON — fall through */
    }

    throw new Error(serverMessage ?? `Ошибка запроса: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<unknown>;
}

export function unwrapEnvelope<T>(payload: unknown, key?: string): T | null {
  if (!isRecord(payload)) {
    return null;
  }

  const envelope = payload as ApiEnvelope<unknown>;

  if (envelope.data !== undefined) {
    if (key && isRecord(envelope.data) && envelope.data[key] !== undefined) {
      return envelope.data[key] as T;
    }
    return envelope.data as T;
  }

  if (key && payload[key] !== undefined) {
    return payload[key] as T;
  }

  return null;
}

export function unwrapArray<T>(payload: unknown, key: string): T[] {
  const fromEnvelope = unwrapEnvelope<T[]>(payload);
  if (Array.isArray(fromEnvelope)) {
    return fromEnvelope;
  }

  const fromKey = unwrapEnvelope<T[]>(payload, key);
  if (Array.isArray(fromKey)) {
    return fromKey;
  }

  return [];
}
