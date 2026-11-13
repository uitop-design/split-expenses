import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  type ArgumentsHost,
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { prismaError } from '../../test/mocks.js';
import { AllExceptionsFilter } from './all-exceptions.filter.js';
import type { ErrorBody } from './error-body.js';

const PATH = '/api/groups/019a7c2e-4b10-7000-8000-0000000000a1/expenses';

function createHost() {
  const json = jest.fn<(body: ErrorBody) => void>();
  const status = jest.fn<(code: number) => { json: typeof json }>(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'POST', originalUrl: PATH }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let logError: jest.SpiedFunction<(...args: unknown[]) => void>;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    logError = jest
      .spyOn(
        (filter as unknown as { logger: { error: (...args: unknown[]) => void } }).logger,
        'error',
      )
      .mockImplementation(() => undefined);
  });

  function handle(exception: unknown) {
    const { host, status, json } = createHost();
    filter.catch(exception, host);
    return { status: status.mock.calls[0]?.[0], body: json.mock.calls[0]?.[0] };
  }

  it('renders the unified error format', () => {
    const { status, body } = handle(new NotFoundException('Group not found'));

    expect(status).toBe(404);
    expect(body).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Group not found',
      path: PATH,
      timestamp: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(body?.timestamp ?? ''))).toBe(false);
  });

  it('keeps the list of validation messages', () => {
    const { status, body } = handle(
      new BadRequestException(['amount: Too small', 'split.memberIds: must not be empty']),
    );

    expect(status).toBe(400);
    expect(body?.message).toEqual(['amount: Too small', 'split.memberIds: must not be empty']);
  });

  it('hides body parser details for malformed json', () => {
    const { status, body } = handle(
      new BadRequestException('Unexpected end of JSON input', {
        cause: new SyntaxError('Unexpected end of JSON input'),
      }),
    );

    expect(status).toBe(400);
    expect(body?.message).toBe('Request body must be valid JSON');
  });

  it.each([
    ['P2002', 409, 'Conflict', 'Resource already exists'],
    ['P2025', 404, 'Not Found', 'Resource not found'],
    ['P2003', 400, 'Bad Request', 'Related resource does not exist'],
  ])('maps Prisma %s to %i', (code, statusCode, error, message) => {
    const { status, body } = handle(prismaError(code));

    expect(status).toBe(statusCode);
    expect(body).toMatchObject({ statusCode, error, message, path: PATH });
  });

  it('passes through http errors raised by services', () => {
    expect(handle(new ConflictException('Member "Ann" already exists')).body).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      message: 'Member "Ann" already exists',
    });
    expect(handle(new PayloadTooLargeException()).status).toBe(413);
  });

  it.each([
    ['an unknown Prisma code', prismaError('P2034')],
    ['a plain error', new Error('connect ECONNREFUSED 10.0.0.5:5432 password=secret')],
    ['a non-error value', 'boom'],
  ])('returns 500 without details for %s', (_, exception) => {
    const { status, body } = handle(exception);

    expect(status).toBe(500);
    expect(body).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
    });
    expect(JSON.stringify(body)).not.toMatch(/ECONNREFUSED|secret|P2034|boom/);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('does not log expected http errors', () => {
    handle(new NotFoundException());

    expect(logError).not.toHaveBeenCalled();
  });
});
