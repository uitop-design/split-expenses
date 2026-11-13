import { z } from 'zod';

const errorBodySchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
});

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function readError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  const parsed = errorBodySchema.safeParse(body);
  const message = parsed.success
    ? [parsed.data.message].flat().join('\n')
    : `Request failed with status ${response.status}`;
  return new ApiError(response.status, message);
}

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  { method = 'GET', body }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw await readError(response);
  }
  if (response.status === 204) {
    return schema.parse(undefined);
  }
  return schema.parse(await response.json());
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 400);
}
