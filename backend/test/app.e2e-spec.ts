import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { HealthModule } from '../src/health/health.module';
import { HealthController } from '../src/health/health.controller';
import { PrismaService } from '../src/prisma/prisma.service';

describe('App & Health (e2e)', () => {
  let app: INestApplication;
  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('debe compilar e inicializar el contexto de la aplicación NestJS correctamente', () => {
    expect(app).toBeDefined();
  });

  it('debe responder satisfactoriamente al endpoint de health', async () => {
    const healthController = app.get(HealthController);
    const result = await healthController.check();
    expect(result.status).toBe('ok');
    expect(result.database.status).toBe('up');
  });
});
