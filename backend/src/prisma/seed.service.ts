import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { RolUsuario, TipoEstrategiaPago } from '@prisma/client';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger('DatabaseSeeder');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (process.env.ENABLE_AUTO_SEED === 'true') {
      await this.seedInitialData();
    } else {
      this.logger.log('🔒 Seeding automático desactivado al iniciar (ENABLE_AUTO_SEED no está activo).');
    }
  }

  async seedInitialData() {
    try {
      // 1. Sucursal predeterminada
      let sucursalCentral = await this.prisma.sucursal.findFirst({
        where: { nombre: 'Sucursal Central' },
      });

      if (!sucursalCentral) {
        sucursalCentral = await this.prisma.sucursal.create({
          data: {
            nombre: 'Sucursal Central',
            direccion: 'Av. Principal #100, Zona Central',
            telefono: '70000000',
            ciudad: 'Santa Cruz',
            activo: true,
          },
        });
        this.logger.log('✅ Sucursal Central inicial creada.');
      }

      // 2. Proveedores mayoristas oficiales (Beby, Javier, Gabriela)
      const proveedores = ['Beby', 'Javier', 'Gabriela'];
      for (const nombreProv of proveedores) {
        const provExists = await this.prisma.proveedor.findFirst({
          where: { nombre: nombreProv },
        });
        if (!provExists) {
          await this.prisma.proveedor.create({
            data: {
              nombre: nombreProv,
              contactoReferencia: 'Mayorista de importación',
            },
          });
        }
      }
      this.logger.log('✅ Proveedores mayoristas base creados (Beby, Javier, Gabriela).');

      // 3. Usuario Administrador inicial
      const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@centralphone.com';
      const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123456';

      const adminExists = await this.prisma.usuario.findFirst({
        where: { email: adminEmail },
      });

      if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        await this.prisma.usuario.create({
          data: {
            nombre: 'Alex Gomez (Admin)',
            email: adminEmail,
            passwordHash,
            rol: RolUsuario.ADMIN,
            sucursalId: sucursalCentral.id,
            activo: true,
          },
        });
        this.logger.log(`✅ Usuario Administrador inicial creado: ${adminEmail}`);
      }

      // 4. Usuario Vendedor de prueba
      const vendedorEmail = process.env.INITIAL_VENDEDOR_EMAIL || 'vendedor@centralphone.com';
      const vendedorPassword = process.env.INITIAL_VENDEDOR_PASSWORD || 'vendedor123';

      const vendedorExists = await this.prisma.usuario.findFirst({
        where: { email: vendedorEmail },
      });

      if (!vendedorExists) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(vendedorPassword, salt);

        await this.prisma.usuario.create({
          data: {
            nombre: 'Yuli Mostrador',
            email: vendedorEmail,
            passwordHash,
            rol: RolUsuario.VENDEDOR,
            sucursalId: sucursalCentral.id,
            activo: true,
          },
        });
        this.logger.log(`✅ Usuario Vendedor creado: ${vendedorEmail}`);
      }

      // 5. Métodos de Pago Base
      const metodos = [
        { codigo: 'EFECTIVO', nombre: 'Efectivo en Caja', tipoEstrategia: TipoEstrategiaPago.CASH },
        { codigo: 'QR_SIMPLE', nombre: 'QR Oficial CentralPhone (BCP)', tipoEstrategia: TipoEstrategiaPago.STATIC_QR },
        { codigo: 'QR_ESTATICO', nombre: 'QR Oficial CentralPhone', tipoEstrategia: TipoEstrategiaPago.STATIC_QR },
        { codigo: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria', tipoEstrategia: TipoEstrategiaPago.STATIC_QR },
      ];

      for (const m of metodos) {
        const exists = await this.prisma.metodoPago.findUnique({
          where: { codigo: m.codigo },
        });
        if (!exists) {
          await this.prisma.metodoPago.create({
            data: m,
          });
        }
      }

      // 6. Categorías de Gastos Operativos de Caja
      const categoriasGasto = ['Chips/Telefonía', 'Alimentación/Tomicha', 'Transporte', 'Suministros de Tienda'];
      for (const cat of categoriasGasto) {
        const exists = await this.prisma.categoriaGasto.findUnique({
          where: { nombre: cat },
        });
        if (!exists) {
          await this.prisma.categoriaGasto.create({
            data: { nombre: cat },
          });
        }
      }

      // 7. Categorías y Catálogo Base de Accesorios
      const catFundas = await this.prisma.categoriaAccesorio.upsert({
        where: { nombre: 'Fundas y Carcasas' },
        update: {},
        create: { nombre: 'Fundas y Carcasas', descripcion: 'Fundas transparentes, silicona y reforzadas' },
      });

      const catCargadores = await this.prisma.categoriaAccesorio.upsert({
        where: { nombre: 'Cargadores y Cables' },
        update: {},
        create: { nombre: 'Cargadores y Cables', descripcion: 'Cabezales 20W, cables USB-C y Lightning' },
      });

      const catHidrogel = await this.prisma.categoriaAccesorio.upsert({
        where: { nombre: 'Láminas e Hidrogel' },
        update: {},
        create: { nombre: 'Láminas e Hidrogel', descripcion: 'Protectores de pantalla y micas' },
      });

      // Accesorios base
      await this.prisma.accesorio.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, categoriaId: catFundas.id, nombre: 'Funda iPhone 13' },
      });
      await this.prisma.accesorio.upsert({
        where: { id: 2 },
        update: {},
        create: { id: 2, categoriaId: catCargadores.id, nombre: 'Cabezal de Carga 20W' },
      });
      await this.prisma.accesorio.upsert({
        where: { id: 3 },
        update: {},
        create: { id: 3, categoriaId: catHidrogel.id, nombre: 'Lámina Hidrogel HD' },
      });

      // 8. Auto-importación de combinaciones desde CSV si el catálogo está vacío
      const countModelos = await this.prisma.modeloDispositivo.count();
      if (countModelos === 0) {
        await this.importarCsvCombinaciones();
      }
    } catch (error) {
      this.logger.warn(`Nota durante el seeder: ${error.message}`);
    }
  }

  private async importarCsvCombinaciones() {
    const possiblePaths = [
      path.resolve(process.cwd(), '../docs/requerimientos/combinaciones_iphone18.csv'),
      path.resolve(process.cwd(), 'docs/requerimientos/combinaciones_iphone18.csv'),
      path.resolve(__dirname, '../../docs/requerimientos/combinaciones_iphone18.csv'),
    ];

    let foundPath = possiblePaths.find((p) => fs.existsSync(p));
    if (!foundPath) {
      this.logger.warn('No se encontró el archivo combinaciones_iphone18.csv para auto-importación inicial.');
      return;
    }

    const content = fs.readFileSync(foundPath, 'utf8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const dataRows = lines.slice(1);

    for (const row of dataRows) {
      const parts = row.split(',').map((p) => p.trim());
      if (parts.length < 4) continue;

      const modeloNombre = parts[1];
      const color = parts[2];
      const capacidadStr = parts[3];

      let capacidadGb = 128;
      if (capacidadStr.toUpperCase().includes('TB')) {
        const tbNum = parseInt(capacidadStr.replace(/[^0-9]/g, ''), 10) || 1;
        capacidadGb = tbNum * 1024;
      } else {
        capacidadGb = parseInt(capacidadStr.replace(/[^0-9]/g, ''), 10) || 128;
      }

      let modelo = await this.prisma.modeloDispositivo.findFirst({
        where: { nombreModelo: modeloNombre },
      });

      if (!modelo) {
        modelo = await this.prisma.modeloDispositivo.create({
          data: {
            nombreModelo: modeloNombre,
            marca: 'Apple',
          },
        });
      }

      const exists = await this.prisma.varianteDispositivo.findUnique({
        where: {
          modeloId_color_capacidadGb_tipoSim: {
            modeloId: modelo.id,
            color,
            capacidadGb,
            tipoSim: 'SIM Físico',
          },
        },
      });

      if (!exists) {
        await this.prisma.varianteDispositivo.create({
          data: {
            modeloId: modelo.id,
            color,
            capacidadGb,
            tipoSim: 'SIM Físico',
          },
        });
      }
    }
    this.logger.log('✅ Catálogo oficial de combinaciones iPhone importado exitosamente desde CSV.');
  }
}
