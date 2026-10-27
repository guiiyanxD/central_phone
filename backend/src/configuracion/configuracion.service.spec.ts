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

  describe('sincronizarTipoCambio', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
      jest.restoreAllMocks();
    });

    it('debe lanzar BadRequestException si WAVESOFT_TC_API_TOKEN no está configurado', async () => {
      delete process.env.WAVESOFT_TC_API_TOKEN;

      await expect(service.sincronizarTipoCambio(1)).rejects.toThrow(
        /WAVESOFT_TC_API_TOKEN/,
      );
    });

    it('debe sincronizar exitosamente con la API WaveSoft y actualizar en Prisma', async () => {
      process.env.WAVESOFT_TC_API_URL = 'https://wavesoft.cloud/api/v1/tc';
      process.env.WAVESOFT_TC_API_TOKEN = 'mock-valid-token-123';

      const mockApiResponse = {
        date: '2026-10-27',
        official: {
          buy: 12.05,
          sell: 12.05,
          average: 12.05,
          status: 'UPDATED',
        },
        parallel: {
          buy: 13.1,
          sell: 13.25,
          average: 13.18,
          status: 'UPDATED',
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      });

      prisma.configuracionNegocio.upsert.mockResolvedValue({
        id: 1,
        tcOficial: 12.05,
        tcParalelo: 13.18,
        tcActualizadoEn: new Date(),
      } as any);

      const res = await service.sincronizarTipoCambio(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://wavesoft.cloud/api/v1/tc',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-valid-token-123',
          }),
        }),
      );

      expect(prisma.configuracionNegocio.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          update: expect.objectContaining({
            tcOficial: 12.05,
            tcParalelo: 13.18,
            actualizadoPorUsuarioId: 1,
          }),
        }),
      );

      expect(res.tcOficial).toBe(12.05);
      expect(res.tcParalelo).toBe(13.18);
    });

    it('debe lanzar BadGatewayException si la API externa devuelve error 500', async () => {
      process.env.WAVESOFT_TC_API_URL = 'https://wavesoft.cloud/api/v1/tc';
      process.env.WAVESOFT_TC_API_TOKEN = 'mock-valid-token-123';

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      await expect(service.sincronizarTipoCambio(1)).rejects.toThrow(
        /La API externa de Tipo de Cambio respondió con error/,
      );
    });
  });
});
