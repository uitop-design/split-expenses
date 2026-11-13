import { jest } from '@jest/globals';
import { type Group, Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';

type AsyncFn = (...args: unknown[]) => Promise<unknown>;

export const GROUP_ID = '019a7c2e-4b10-7000-8000-0000000000a1';
export const ANN = '019a7c2e-4b10-7000-8000-0000000000b1';
export const BOB = '019a7c2e-4b10-7000-8000-0000000000b2';
export const CAT = '019a7c2e-4b10-7000-8000-0000000000b3';
export const STRANGER = '019a7c2e-4b10-7000-8000-0000000000c1';

export function createPrismaMock() {
  const mock = {
    group: {
      findUnique: jest.fn<AsyncFn>(),
      deleteMany: jest.fn<AsyncFn>(),
    },
    member: {
      count: jest.fn<AsyncFn>(),
      create: jest.fn<AsyncFn>(),
      findFirst: jest.fn<AsyncFn>(),
      findMany: jest.fn<AsyncFn>(),
      delete: jest.fn<AsyncFn>(),
    },
    expense: {
      create: jest.fn<AsyncFn>(),
    },
    $transaction: jest.fn<AsyncFn>(),
  };
  mock.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (tx: typeof mock) => Promise<unknown>)(mock)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return { mock, service: mock as unknown as PrismaService };
}

export function buildGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: GROUP_ID,
    name: 'Trip',
    currency: 'UAH',
    createdAt: new Date('2026-11-01T09:00:00Z'),
    updatedAt: new Date('2026-11-01T09:00:00Z'),
    ...overrides,
  };
}

export function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(`Prisma error ${code}`, {
    code,
    clientVersion: 'test',
  });
}
