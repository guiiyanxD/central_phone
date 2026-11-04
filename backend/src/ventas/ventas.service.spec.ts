import { Test, TestingModule } from '@nestjs/testing';
import { VentasService } from './ventas.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EstadoCaja, EstadoInventario, EstadoVenta, TipoItemVenta } from '@prisma/client';
import {
  CashPaymentStrategy,
  QrPaymentStrategy,
  TransferPaymentStrategy,
  PosCardPaymentStrategy,
  PaymentStrategyRegistry,
} from './strategies';

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
        CashPaymentStrategy,
        QrPaymentStrategy,
        TransferPaymentStrategy,
        PosCardPaymentStrategy,
        PaymentStrategyRegistry,
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

    it('debe lanzar BadRequestException si no existe una caja abierta para la sucursal', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue(null);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ForbiddenException si un vendedor intenta registrar una venta en una sucursal distinta a la suya (CENTRALPHONE-CONF-006)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);

      await expect(
        service.createVenta(
          usuarioId,
          sucursalId,
          {
            sucursalId: 2, // Intento de vender en sucursal 2 siendo vendedor de sucursal 1
            metodoPagoCodigo: 'EFECTIVO',
            cliente: clienteValido,
            dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
          },
          'VENDEDOR',
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir a un vendedor procesar una venta si la caja fue abierta por otro vendedor en la misma sucursal', async () => {
      // Caja abierta por usuario 99 en la sucursal 1
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        usuarioAperturaId: 99,
        sucursalId: 1,
        estado: EstadoCaja.ABIERTA,
      } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);
      prisma.cliente.findFirst.mockResolvedValue({ id: 1, ...clienteValido } as any);

      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
        estadoInventario: EstadoInventario.DISPONIBLE,
        costoBs: 4000,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
      } as any);

      prisma.venta.create.mockResolvedValue({ id: 200, totalVentaBs: 4500 } as any);
      prisma.detalleVenta.create.mockResolvedValue({ id: 1 } as any);
      prisma.venta.findUnique.mockResolvedValue({ id: 200, totalVentaBs: 4500, detalles: [] } as any);

      // Usuario 1 vendiendo en la caja de la sucursal
      const res = await service.createVenta(usuarioId, sucursalId, {
        metodoPagoCodigo: 'EFECTIVO',
        cliente: clienteValido,
        dispositivos: [{ dispositivoId: 10, precioVentaBs: 4500 }],
      }, 'VENDEDOR');

      expect(res.id).toBe(200);
    });

    it('debe lanzar BadRequestException si el dispositivo pertenece a otra sucursal para un VENDEDOR (CENTRALPHONE-CONF-006)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      // Teléfono pertenece a sucursal 2, pero la venta se procesa en sucursal 1
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 2,
        estadoInventario: EstadoInventario.DISPONIBLE,
        costoBs: 4000,
        variante: { modelo: { nombreModelo: 'iPhone 15 Pro' } },
      } as any);

      await expect(
        service.createVenta(
          usuarioId,
          sucursalId,
          {
            metodoPagoCodigo: 'EFECTIVO',
            cliente: clienteValido,
            dispositivos: [{ dispositivoId: 10, precioVentaBs: 5000 }],
          },
          'VENDEDOR',
        ),
      ).rejects.toThrow(/pertenece a otra sucursal/);
    });

    it('debe permitir a un usuario ADMIN vender un dispositivo de otra sucursal en la sucursal actual (venta inter-sucursal)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      // Teléfono pertenece a sucursal 2, pero el ADMIN vende en sucursal 1
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 2,
        estadoInventario: EstadoInventario.DISPONIBLE,
        costoBs: 4000,
        variante: { modelo: { nombreModelo: 'iPhone 15 Pro' } },
      } as any);

      prisma.dispositivo.updateMany.mockResolvedValue({ count: 1 });
      prisma.venta.create.mockResolvedValue({ id: 202, totalVentaBs: 5000 } as any);
      prisma.detalleVenta.create.mockResolvedValue({ id: 1 } as any);
      prisma.venta.findUnique.mockResolvedValue({
        id: 202,
        totalVentaBs: 5000,
        cliente: { id: 99, ...clienteValido },
        detalles: [
          { tipoItem: TipoItemVenta.DISPOSITIVO, cantidad: 1, costoUnitarioBs: 4000, precioUnitarioBs: 5000 },
        ],
      } as any);

      const res = await service.createVenta(
        usuarioId,
        sucursalId,
        {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 5000 }],
        },
        'ADMIN',
      );

      expect(res.id).toBe(202);
      expect(prisma.dispositivo.updateMany).toHaveBeenCalledWith({
        where: { id: 10, estadoInventario: EstadoInventario.DISPONIBLE },
        data: { estadoInventario: EstadoInventario.VENDIDO },
      });
    });

    it('debe lanzar BadRequestException si el lote de accesorio pertenece a otra sucursal para un VENDEDOR (CENTRALPHONE-CONF-006)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      // Lote pertenece a sucursal 2
      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 30,
        sucursalId: 2,
        stockActual: 10,
        costoUnitarioBs: 20,
        accesorio: { nombre: 'Funda MagSafe' },
        nombreDiferenciador: 'Silicona Azul',
      } as any);

      await expect(
        service.createVenta(
          usuarioId,
          sucursalId,
          {
            metodoPagoCodigo: 'EFECTIVO',
            cliente: clienteValido,
            accesorios: [{ loteAccesorioId: 30, cantidad: 1, precioVentaBs: 50 }],
          },
          'VENDEDOR',
        ),
      ).rejects.toThrow(/pertenece a otra sucursal/);
    });

    it('debe permitir a un usuario ADMIN vender un lote de accesorio de otra sucursal en la sucursal actual (venta inter-sucursal)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      // Lote pertenece a sucursal 2, pero el ADMIN vende en sucursal 1
      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 30,
        sucursalId: 2,
        stockActual: 10,
        costoUnitarioBs: 20,
        accesorio: { nombre: 'Funda MagSafe' },
        nombreDiferenciador: 'Silicona Azul',
      } as any);

      prisma.loteAccesorio.updateMany.mockResolvedValue({ count: 1 });
      prisma.venta.create.mockResolvedValue({ id: 203, totalVentaBs: 50 } as any);
      prisma.detalleVenta.create.mockResolvedValue({ id: 2 } as any);
      prisma.venta.findUnique.mockResolvedValue({
        id: 203,
        totalVentaBs: 50,
        cliente: { id: 99, ...clienteValido },
        detalles: [
          { tipoItem: TipoItemVenta.ACCESORIO, cantidad: 1, costoUnitarioBs: 20, precioUnitarioBs: 50 },
        ],
      } as any);

      const res = await service.createVenta(
        usuarioId,
        sucursalId,
        {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          accesorios: [{ loteAccesorioId: 30, cantidad: 1, precioVentaBs: 50 }],
        },
        'ADMIN',
      );

      expect(res.id).toBe(203);
      expect(prisma.loteAccesorio.updateMany).toHaveBeenCalledWith({
        where: { id: 30, stockActual: { gte: 1 } },
        data: { stockActual: { decrement: 1 } },
      });
    });

    it('debe lanzar BadRequestException si no se proporcionan los datos obligatorios del comprador (nombre o teléfono)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        sucursalId: 1,
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
        sucursalId: 1,
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
        sucursalId: 1,
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
        sucursalId: 1,
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
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
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
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
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
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 3,
        sucursalId: 1,
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
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);
      prisma.cliente.findFirst.mockResolvedValue({ id: 99, ...clienteValido } as any);

      // Mock teléfono
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
        estadoInventario: EstadoInventario.DISPONIBLE,
        costoBs: 4000,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
      } as any);

      // Mock accesorio
      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 20,
        sucursalId: 1,
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

      expect(prisma.dispositivo.updateMany).toHaveBeenCalledWith({
        where: { id: 10, estadoInventario: EstadoInventario.DISPONIBLE },
        data: { estadoInventario: EstadoInventario.VENDIDO },
      });

      expect(prisma.loteAccesorio.updateMany).toHaveBeenCalledWith({
        where: { id: 20, stockActual: { gte: 1 } },
        data: { stockActual: { decrement: 1 } },
      });

      expect(result.id).toBe(101);
    });

    it('debe lanzar ConflictException si ocurre una colisión concurrente al vender el dispositivo (count = 0)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
        estadoInventario: EstadoInventario.DISPONIBLE,
        costoBs: 4000,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
      } as any);

      // Simular que otra transacción concurrente ganó y actualizó el estado primero
      prisma.dispositivo.updateMany.mockResolvedValue({ count: 0 } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 4500 }],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si ocurre una colisión concurrente al descontar stock del accesorio (count = 0)', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);
      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 20,
        sucursalId: 1,
        stockActual: 5,
        costoUnitarioBs: 30,
        nombreDiferenciador: 'MagSafe',
        accesorio: { nombre: 'Funda Pro' },
      } as any);

      // Simular que otra transacción concurrente agotó el stock primero
      prisma.loteAccesorio.updateMany.mockResolvedValue({ count: 0 } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          accesorios: [{ loteAccesorioId: 20, cantidad: 1, precioVentaBs: 100 }],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si la caja fue cerrada entre la validación inicial y la transacción (TOCTOU)', async () => {
      // Primera lectura fuera de la transacción ve la caja abierta
      prisma.cajaDiaria.findFirst
        .mockResolvedValueOnce({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA } as any)
        // Segunda lectura dentro de la transacción ve que fue cerrada
        .mockResolvedValueOnce(null);

      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 4500 }],
        })
      ).rejects.toThrow(ConflictException);
    });
    it('debe rechazar la venta si el valorTomaBs de la permuta supera el total de la venta', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA });
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' });
      prisma.cliente.findFirst.mockResolvedValue({ id: 1, ...clienteValido });
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
        estadoInventario: EstadoInventario.DISPONIBLE,
        costoBs: 1000,
        variante: { modelo: { nombreModelo: 'iPhone 13' } },
      });

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          cliente: clienteValido,
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 2000 }],
          permuta: {
            varianteId: 1,
            imei1: '123456789012345',
            porcentajeBateria: 85,
            valorTomaBs: 2500,
          },
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe registrar exitosamente una venta con permuta trade-in y dar de alta el equipo en inventario', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, sucursalId: 1, estado: EstadoCaja.ABIERTA });
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' });
      prisma.cliente.findFirst.mockResolvedValue({ id: 1, ...clienteValido });
      prisma.dispositivo.findUnique.mockImplementation(async (args: any) => {
        if (args.where?.id === 10) {
          return {
            id: 10,
            sucursalId: 1,
            estadoInventario: EstadoInventario.DISPONIBLE,
            costoBs: 3000,
            variante: { modelo: { nombreModelo: 'iPhone 15' } },
          } as any;
        }
        return null; // No existe IMEI duplicado
      });

      prisma.varianteDispositivo.findUnique.mockResolvedValue({
        id: 2,
        color: 'Negro',
        capacidad: '128GB',
        modelo: { nombreModelo: 'iPhone 12' },
      });
      prisma.proveedor.findFirst.mockResolvedValue(null);
      prisma.proveedor.create.mockResolvedValue({ id: 99, nombre: 'Cliente Permuta: Juan Carlos Perez' });
      prisma.notaIngreso.create.mockResolvedValue({ id: 55, numeroComprobante: 'PERM-POS-123456' });
      prisma.dispositivo.create.mockResolvedValue({
        id: 77,
        imei1: '123456789012345',
        condicion: 'PERMUTA',
        costoBs: 1500,
        precioVentaSugeridoBs: 1725,
      });
      prisma.venta.create.mockResolvedValue({ id: 100 });
      prisma.venta.findUnique.mockResolvedValue({
        id: 100,
        totalVentaBs: 4000,
        montoPermutaBs: 1500,
        montoEfectivoBs: 2500,
        montoDigitalBs: 0,
        permutaDispositivoId: 77,
      });

      const resultado = await service.createVenta(usuarioId, sucursalId, {
        metodoPagoCodigo: 'EFECTIVO',
        cliente: clienteValido,
        dispositivos: [{ dispositivoId: 10, precioVentaBs: 4000 }],
        permuta: {
          varianteId: 2,
          imei1: '123456789012345',
          porcentajeBateria: 85,
          valorTomaBs: 1500,
        },
      });

      expect(prisma.dispositivo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            condicion: 'PERMUTA',
            costoBs: 1500,
            precioVentaSugeridoBs: 1725,
            estadoInventario: EstadoInventario.DISPONIBLE,
          }),
        })
      );

      expect(prisma.venta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalVentaBs: 4000,
            montoPermutaBs: 1500,
            montoEfectivoBs: 2500,
            montoDigitalBs: 0,
            permutaDispositivoId: 77,
          }),
        })
      );

      expect(resultado.montoPermutaBs).toBe(1500);
    });
  });

  describe('findAll', () => {
    it('debe calcular dinámicamente la ganancia neta en 3FN si el rol es ADMIN', async () => {
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

      const res = await service.findAll(undefined, undefined, undefined, 'ADMIN');
      expect(res).toHaveLength(1);
      // Costo total = 4000 + 100 = 4100
      expect(res[0].costoTotalBs).toBe(4100);
      // Ganancia neta = 5000 - 4100 = 900
      expect(res[0].gananciaNetaBs).toBe(900);
    });

    it('debe purgar costos y ganancia neta para usuarios con rol VENDEDOR (CENTRALPHONE-CONF-001)', async () => {
      prisma.venta.findMany.mockResolvedValue([
        {
          id: 1,
          totalVentaBs: 5000,
          detalles: [
            { costoUnitarioBs: 4000, cantidad: 1, precioUnitarioBs: 4800, subtotalBs: 4800 },
          ],
        },
      ] as any);

      const res = await service.findAll(undefined, undefined, undefined, 'VENDEDOR');
      expect(res).toHaveLength(1);
      expect((res[0] as any).costoTotalBs).toBeUndefined();
      expect((res[0] as any).gananciaNetaBs).toBeUndefined();
      expect((res[0].detalles[0] as any).costoUnitarioBs).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('debe lanzar NotFoundException si la venta no existe', async () => {
      prisma.venta.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar venta con ganancia neta calculada si es ADMIN', async () => {
      prisma.venta.findUnique.mockResolvedValue({
        id: 7,
        totalVentaBs: 1000,
        detalles: [
          { costoUnitarioBs: 700, cantidad: 1 },
        ],
      } as any);

      const res = await service.findOne(7, 'ADMIN');
      expect(res.costoTotalBs).toBe(700);
      expect(res.gananciaNetaBs).toBe(300);
    });

    it('debe purgar costos si quien consulta es VENDEDOR (CENTRALPHONE-CONF-001)', async () => {
      prisma.venta.findUnique.mockResolvedValue({
        id: 7,
        totalVentaBs: 1000,
        detalles: [
          { costoUnitarioBs: 700, cantidad: 1 },
        ],
      } as any);

      const res = await service.findOne(7, 'VENDEDOR');
      expect((res as any).costoTotalBs).toBeUndefined();
      expect((res as any).gananciaNetaBs).toBeUndefined();
      expect((res.detalles[0] as any).costoUnitarioBs).toBeUndefined();
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
    it('debe rechazar la anulación si el teléfono recibido en permuta ya fue vendido a otro cliente', async () => {
      prisma.venta.findUnique.mockResolvedValue({
        id: 10,
        estado: EstadoVenta.COMPLETADA,
        permutaDispositivoId: 50,
        detalles: [],
      });
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 50,
        estadoInventario: EstadoInventario.VENDIDO,
        detalleVentas: [{ id: 99 }],
      });

      await expect(
        service.anularVenta(10, 1, { motivo: 'Devolución de cliente' })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe marcar el teléfono de permuta como DEFECTUOSO y anular su nota de ingreso al anular la venta', async () => {
      prisma.venta.findUnique.mockResolvedValue({
        id: 10,
        estado: EstadoVenta.COMPLETADA,
        permutaDispositivoId: 50,
        permutaNotaIngresoId: 30,
        detalles: [],
      });
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 50,
        estadoInventario: EstadoInventario.DISPONIBLE,
        detalleVentas: [],
      });
      prisma.dispositivo.update.mockResolvedValue({ id: 50 });
      prisma.notaIngreso.update.mockResolvedValue({ id: 30 });
      prisma.venta.update.mockResolvedValue({
        id: 10,
        estado: EstadoVenta.ANULADA,
        motivoAnulacion: 'Devolución de cliente',
      });

      const res = await service.anularVenta(10, 1, { motivo: 'Devolución de cliente' });

      expect(prisma.dispositivo.update).toHaveBeenCalledWith({
        where: { id: 50 },
        data: { estadoInventario: EstadoInventario.DEFECTUOSO },
      });
      expect(prisma.notaIngreso.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 30 },
          data: expect.objectContaining({ estado: 'ANULADA' }),
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

    it('debe filtrar correctamente el día completo (00:00:00 a 23:59:59.999) en hora local al recibir YYYY-MM-DD', async () => {
      prisma.venta.findMany.mockResolvedValue([]);
      prisma.gastoOperativo.findMany.mockResolvedValue([]);

      await service.getReporteRentabilidad('2026-10-24', '2026-10-24');

      expect(prisma.venta.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fechaHora: expect.objectContaining({
              gte: new Date('2026-10-24T00:00:00'),
              lte: new Date('2026-10-24T23:59:59.999'),
            }),
          }),
        })
      );
    });
  });
});
