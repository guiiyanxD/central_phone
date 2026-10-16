import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionService } from './configuracion.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfiguracionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ConfiguracionService>(ConfiguracionService);
  });

  describe('getConfiguracion', () => {
    it('debe obtener la configuración oficial del negocio', async () => {
      prisma.configuracionNegocio.findUnique.mockResolvedValue({
        id: 1,
        nombreEmpresa: 'CentralPhone',
        bancoOficial: 'Banco de Crédito BCP',
      } as any);

      const res = await service.getConfiguracion();
      expect(res?.nombreEmpresa).toBe('CentralPhone');
    });
  });

  describe('updateConfiguracion', () => {
    it('debe actualizar los datos bancarios y código QR oficial por un admin', async () => {
      prisma.configuracionNegocio.upsert.mockResolvedValue({
        id: 1,
        nombreEmpresa: 'CentralPhone SRL',
        bancoOficial: 'Banco Unión',
        actualizadoPorUsuarioId: 1,
      } as any);

      const res = await service.updateConfiguracion(
        {
          nombreEmpresa: 'CentralPhone SRL',
          bancoOficial: 'Banco Unión',
        },
        1
      );

      expect(res.bancoOficial).toBe('Banco Unión');
      expect(prisma.configuracionNegocio.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          update: expect.objectContaining({
            nombreEmpresa: 'CentralPhone SRL',
            actualizadoPorUsuarioId: 1,
          }),
        })
      );
    });
  });

  describe('onModuleInit', () => {
    it('debe crear la configuración inicial si no existe en la base de datos', async () => {
      prisma.configuracionNegocio.findUnique.mockResolvedValue(null);
      prisma.configuracionNegocio.create.mockResolvedValue({ id: 1 } as any);

      await service.onModuleInit();
      expect(prisma.configuracionNegocio.create).toHaveBeenCalled();
    });

    it('no debe duplicar la configuración si ya existe en la base de datos', async () => {
      prisma.configuracionNegocio.findUnique.mockResolvedValue({ id: 1 } as any);

      await service.onModuleInit();
      expect(prisma.configuracionNegocio.create).not.toHaveBeenCalled();
    });
  });
});
