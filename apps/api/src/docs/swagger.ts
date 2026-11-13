import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Split Expenses API')
    .setDescription(
      'Groups, shared expenses, balances and the shortest list of transfers to settle up. ' +
        'All amounts are integers in minor currency units.',
    )
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document));
}
