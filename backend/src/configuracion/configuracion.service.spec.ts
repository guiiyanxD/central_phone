import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionService } from './configuracion.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { ImageOptimizerService } from '../common/services/image-optimizer.service';

describe('ConfiguracionService', () => {
  let service: ConfiguracionService;
  let prisma: MockPrismaService;
  let imageOptimizer: Partial<ImageOptimizerService>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    imageOptimizer = {
      processAndSaveQrImage: jest.fn().mockImplementation((val) =>
        Promise.resolve({
          dataUri: val,
          filePath: '/app/uploads/qr/qr_oficial.png',
          sizeBytes: 100,
          width: 800,
          height: 800,
          format: 'png',
        }),
      ),
      readPersistedQrImage: jest.fn().mockReturnValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfiguracionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ImageOptimizerService, useValue: imageOptimizer },
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
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);
    const validPngBase64 = `data:image/png;base64,${validPngBuffer.toString('base64')}`;

    it('debe actualizar los datos bancarios y código QR oficial por un admin', async () => {
      prisma.configuracionNegocio.upsert.mockResolvedValue({
        id: 1,
        nombreEmpresa: 'CentralPhone SRL',
        bancoOficial: 'Banco Unión',
        qrOficialImagenUrl: validPngBase64,
        actualizadoPorUsuarioId: 1,
      } as any);

      const res = await service.updateConfiguracion(
        {
          nombreEmpresa: 'CentralPhone SRL',
          bancoOficial: 'Banco Unión',
          qrOficialImagenUrl: validPngBase64,
        },
        1
      );

      expect(res.bancoOficial).toBe('Banco Unión');
      expect(prisma.configuracionNegocio.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          update: expect.objectContaining({
            nombreEmpresa: 'CentralPhone SRL',
            qrOficialImagenUrl: validPngBase64,
            actualizadoPorUsuarioId: 1,
          }),
        })
      );
    });

    it('debe rechazar la actualización si la imagen del QR tiene bytes corruptos o spoofed', async () => {
      const spoofedBase64 = `data:image/png;base64,${Buffer.from('MALICIOUS_EXE_PAYLOAD').toString('base64')}`;

      await expect(
        service.updateConfiguracion(
          {
            nombreEmpresa: 'CentralPhone SRL',
            qrOficialImagenUrl: spoofedBase64,
          },
          1
        )
      ).rejects.toThrow(/Firma binaria de imagen inválida/);
    });

    it('debe rechazar la actualización si se intenta inyectar un SVG con scripts', async () => {
      await expect(
        service.updateConfiguracion(
          {
            nombreEmpresa: 'CentralPhone SRL',
            qrOficialImagenUrl: 'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+',
          },
          1
        )
      ).rejects.toThrow(/Los archivos SVG, scripts y HTML no están permitidos/);
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
