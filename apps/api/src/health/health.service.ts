import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const CHECK_TIMEOUT_MS = 2000;

export interface HealthReport {
  status: 'ok';
  checks: { postgres: 'up' };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthReport> {
    if (!(await this.isPostgresUp())) {
      throw new ServiceUnavailableException('Unavailable dependencies: postgres');
    }
    return { status: 'ok', checks: { postgres: 'up' } };
  }

  private async isPostgresUp(): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), CHECK_TIMEOUT_MS);
    });
    try {
      return await Promise.race([this.prisma.$queryRaw`SELECT 1`.then(() => true), timeout]);
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
