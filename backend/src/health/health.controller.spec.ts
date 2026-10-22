import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debe responder status ok y database up si la BD responde exitosamente', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    const res = await controller.check();

    expect(res.status).toBe('ok');
    expect(res.database.status).toBe('up');
    expect(typeof res.database.latencyMs).toBe('number');
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('debe lanzar ServiceUnavailableException con database down si la BD falla', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Connection lost to PostgreSQL'));

    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);

    try {
      await controller.check();
    } catch (err: any) {
      const response = err.getResponse();
      expect(response.status).toBe('error');
      expect(response.database.status).toBe('down');
      expect(response.database.error).toBe('Connection lost to PostgreSQL');
    }
  });
});
