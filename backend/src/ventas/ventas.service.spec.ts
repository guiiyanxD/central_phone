import { Test, TestingModule } from '@nestjs/testing';
import { VentasService } from './ventas.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EstadoCaja, EstadoInventario, EstadoVenta, TipoItemVenta } from '@prisma/client';

describe('VentasService', () => {
  let service: VentasService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();
    prisma.cliente.findFirst.mockResolvedValue({ id: 1, nombreCompleto: 'Juan Carlos Perez', telefono: '70012345' } as any);
    prisma.cliente.create.mockResolvedValue({ id: 1, nombreCompleto: 'Juan Carlos Perez', telefono: '70012345' } as any);
    prisma.cliente.update.mockResolvedValue({ id: 1, nombreCompleto: 'Juan Carlos Perez', telefono: '70012345' } as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VentasService>(VentasService);
  });

  describe('createVenta', () => {
    const usuarioId = 1;
    const sucursalId = 1;
    const clienteValido = {
      nombreCompleto: 'Juan Carlos Perez',
      telefono: '70012345',
      ciNit: '4567890 SC',
    };

    it('debe lanzar BadRequestException si no existe una caja abierta para el turno', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue(null);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si no se proporcionan los datos obligatorios del comprador (nombre o teléfono)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        estado: EstadoCaja.ABIERTA,
      } as any);

      // Sin cliente
      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        } as any)
      ).rejects.toThrow(/Los datos del cliente.*son obligatorios/);

      // Con teléfono vacío
      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: { nombreCompleto: 'Juan Perez', telefono: '' },
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        })
      ).rejects.toThrow(/Los datos del cliente.*son obligatorios/);
    });

    it('debe lanzar BadRequestException si el carrito está completamente vacío', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        estado: EstadoCaja.ABIERTA,
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [],
          accesorios: [],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el método de pago no existe', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        estado: EstadoCaja.ABIERTA,
      } as any);
      prisma.metodoPago.findUnique.mockResolvedValue(null);
      prisma.metodoPago.findFirst.mockResolvedValue(null);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'BITCOIN_INVENTADO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si es cobro QR o transferencia sin referencia bancaria', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        estado: EstadoCaja.ABIERTA,
      } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({
        id: 2,
        codigo: 'QR_SIMPLE',
        nombre: 'Pago QR',
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'QR_SIMPLE',
          comprobanteReferencia: '',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si el teléfono no se encuentra DISPONIBLE', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        estadoInventario: EstadoInventario.VENDIDO,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
        costoBs: 4000,
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 4500 }],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si el precio pactado es menor al costo de adquisición del dispositivo', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        estadoInventario: EstadoInventario.DISPONIBLE,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
        costoBs: 5000,
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 4800 }], // Menor a costo
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si el stock del lote de accesorios es insuficiente', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 3,
        stockActual: 2,
        costoUnitarioBs: 20,
        accesorio: { nombre: 'Funda Silicona' },
        nombreDiferenciador: 'MagSafe',
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          accesorios: [{ loteAccesorioId: 3, cantidad: 5, precioVentaBs: 50 }],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debe procesar exitosamente la venta atómica de un teléfono y un accesorio con vinculación de cliente', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);
      prisma.cliente.findFirst.mockResolvedValue({ id: 99, ...clienteValido } as any);

      // Mock teléfono
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        estadoInventario: EstadoInventario.DISPONIBLE,
        costoBs: 4000,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
      } as any);

      // Mock accesorio
      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 20,
        stockActual: 10,
        costoUnitarioBs: 30,
        accesorio: { nombre: 'Cargador 20W' },
        nombreDiferenciador: 'Caja Sellada',
      } as any);

      // Mock creación de venta y detalle
      prisma.venta.create.mockResolvedValue({ id: 101, totalVentaBs: 4600 } as any);
      prisma.detalleVenta.create.mockResolvedValue({ id: 1 } as any);

      prisma.venta.findUnique.mockResolvedValue({
        id: 101,
        totalVentaBs: 4600,
        cliente: { id: 99, ...clienteValido },
        detalles: [
          { tipoItem: TipoItemVenta.DISPOSITIVO, cantidad: 1, costoUnitarioBs: 4000, precioUnitarioBs: 4500 },
          { tipoItem: TipoItemVenta.ACCESORIO, cantidad: 1, costoUnitarioBs: 30, precioUnitarioBs: 100 },
        ],
      } as any);

      const result = await service.createVenta(usuarioId, sucursalId, {
        metodoPagoCodigo: 'EFECTIVO',
        cliente: clienteValido,
        dispositivos: [{ dispositivoId: 10, precioVentaBs: 4500 }],
        accesorios: [{ loteAccesorioId: 20, cantidad: 1, precioVentaBs: 100 }],
      });

      expect(prisma.dispositivo.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { estadoInventario: EstadoInventario.VENDIDO },
      });

      expect(prisma.loteAccesorio.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { stockActual: 9 },
      });

      expect(result.id).toBe(101);
    });
  });

  describe('findAll', () => {
    it('debe calcular dinámicamente la ganancia neta en 3FN para cada venta', async () => {
      prisma.venta.findMany.mockResolvedValue([
        {
          id: 1,
          totalVentaBs: 5000,
          detalles: [
            { costoUnitarioBs: 4000, cantidad: 1, precioUnitarioBs: 4800, subtotalBs: 4800 },
            { costoUnitarioBs: 50, cantidad: 2, precioUnitarioBs: 100, subtotalBs: 200 },
          ],
        },
      ] as any);

      const res = await service.findAll();
      expect(res).toHaveLength(1);
      // Costo total = 4000 + 100 = 4100
      expect(res[0].costoTotalBs).toBe(4100);
      // Ganancia neta = 5000 - 4100 = 900
      expect(res[0].gananciaNetaBs).toBe(900);
    });
  });

  describe('findOne', () => {
    it('debe lanzar NotFoundException si la venta no existe', async () => {
      prisma.venta.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar venta con ganancia neta calculada', async () => {
      prisma.venta.findUnique.mockResolvedValue({
        id: 7,
        totalVentaBs: 1000,
        detalles: [
          { costoUnitarioBs: 700, cantidad: 1 },
        ],
      } as any);

      const res = await service.findOne(7);
      expect(res.costoTotalBs).toBe(700);
      expect(res.gananciaNetaBs).toBe(300);
    });
  });

  describe('anularVenta', () => {
    it('debe lanzar NotFoundException si la venta no existe', async () => {
      prisma.venta.findUnique.mockResolvedValue(null);

      await expect(
        service.anularVenta(999, 1, { motivo: 'Error en registro de pago' })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si la venta ya está anulada', async () => {
      prisma.venta.findUnique.mockResolvedValue({
        id: 10,
        estado: EstadoVenta.ANULADA,
        detalles: [],
      } as any);

      await expect(
        service.anularVenta(10, 1, { motivo: 'Intento de anular nuevamente' })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe revertir atómicamente el estado del teléfono a DISPONIBLE e incrementar stock de accesorio', async () => {
      prisma.venta.findUnique.mockResolvedValue({
        id: 10,
        estado: EstadoVenta.COMPLETADA,
        detalles: [
          { tipoItem: TipoItemVenta.DISPOSITIVO, dispositivoId: 5 },
          { tipoItem: TipoItemVenta.ACCESORIO, loteAccesorioId: 8, cantidad: 3 },
        ],
      } as any);

      prisma.venta.update.mockResolvedValue({
        id: 10,
        estado: EstadoVenta.ANULADA,
        motivoAnulacion: 'Error en datos del cliente',
        anuladoPorUsuarioId: 1,
      } as any);

      const res = await service.anularVenta(10, 1, { motivo: 'Error en datos del cliente' });

      expect(prisma.dispositivo.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { estadoInventario: EstadoInventario.DISPONIBLE },
      });

      expect(prisma.loteAccesorio.update).toHaveBeenCalledWith({
        where: { id: 8 },
        data: { stockActual: { increment: 3 } },
      });

      expect(prisma.venta.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 10 },
          data: expect.objectContaining({
            estado: EstadoVenta.ANULADA,
            motivoAnulacion: 'Error en datos del cliente',
            anuladoPorUsuarioId: 1,
          }),
        })
      );

      expect(res.estado).toBe(EstadoVenta.ANULADA);
    });
  });

  describe('getReporteRentabilidad', () => {
    it('debe calcular correctamente ingresos, costos CMV, gastos operativos y ganancia neta real', async () => {
      prisma.venta.findMany.mockResolvedValue([
        {
          id: 1,
          estado: EstadoVenta.COMPLETADA,
          totalVentaBs: 5000,
          metodoPago: { nombre: 'Efectivo', codigo: 'EFECTIVO' },
          usuario: { nombre: 'Vendedor 1' },
          cliente: { nombreCompleto: 'Juan Perez' },
          caja: { sucursal: { nombre: 'Central' } },
          detalles: [
            { tipoItem: TipoItemVenta.DISPOSITIVO, cantidad: 1, costoUnitarioBs: 4000, precioUnitarioBs: 5000, subtotalBs: 5000 },
          ],
        },
        {
          id: 2,
          estado: EstadoVenta.ANULADA,
          totalVentaBs: 3000,
          metodoPago: { nombre: 'Efectivo', codigo: 'EFECTIVO' },
          usuario: { nombre: 'Vendedor 2' },
          cliente: { nombreCompleto: 'Maria Lopez' },
          caja: { sucursal: { nombre: 'Central' } },
          detalles: [
            { tipoItem: TipoItemVenta.DISPOSITIVO, cantidad: 1, costoUnitarioBs: 2500, precioUnitarioBs: 3000, subtotalBs: 3000 },
          ],
        },
      ] as any);

      prisma.gastoOperativo.findMany.mockResolvedValue([
        {
          id: 1,
          montoBs: 200,
          categoria: { nombre: 'Almuerzos' },
          metodoPago: { nombre: 'Efectivo' },
          caja: { sucursal: { nombre: 'Central' } },
        },
      ] as any);

      const reporte = await service.getReporteRentabilidad();

      expect(reporte.resumen.totalIngresosBs).toBe(5000);
      expect(reporte.resumen.totalCostoMercaderiaBs).toBe(4000);
      expect(reporte.resumen.gananciaBrutaBs).toBe(1000);
      expect(reporte.resumen.totalGastosOperativosBs).toBe(200);
      expect(reporte.resumen.gananciaNetaRealBs).toBe(800);
      expect(reporte.resumen.cantidadVentasCompletadas).toBe(1);
      expect(reporte.resumen.cantidadVentasAnuladas).toBe(1);
    });
  });
});
