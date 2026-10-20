import { PrismaClient, RolUsuario, TipoEstrategiaPago, CondicionDispositivo, EstadoInventario, EstadoCaja, EstadoVenta, TipoItemVenta } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 [SIMULATION 2026] Iniciando generación de dataset de prueba para CentralPhone...');

  // Sincronizar secuencias de Postgres para evitar colisiones con IDs manuales
  const tablasConSecuencia = [
    'sucursales',
    'usuarios',
    'proveedores',
    'clientes',
    'notas_ingreso',
    'modelos_dispositivo',
    'variantes_dispositivo',
    'dispositivos',
    'categorias_accesorio',
    'accesorios',
    'lotes_accesorio',
    'cajas_diarias',
    'categorias_gasto',
    'gastos_operativos',
    'metodos_pago',
    'ventas',
    'detalle_ventas',
  ];

  for (const tabla of tablasConSecuencia) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('${tabla}', 'id'), coalesce(max(id), 1) + 1, false) FROM "${tabla}";`
      );
    } catch {
      // Ignorar si la tabla no tiene secuencia serial
    }
  }

  // ==========================================
  // 1. SUCURSALES (CENTRAL Y EQUIPETROL)
  // ==========================================
  console.log('🏢 1. Configurando Sucursales...');
  
  let sucursalCentral = await prisma.sucursal.findFirst({
    where: { nombre: { contains: 'Central' } },
  });

  if (!sucursalCentral) {
    sucursalCentral = await prisma.sucursal.create({
      data: {
        nombre: 'Sucursal Central',
        direccion: 'Av. Principal #100, Zona Central',
        telefono: '70000000',
        ciudad: 'Santa Cruz',
        activo: true,
      },
    });
    console.log(`   ✅ Creada Sucursal Central (ID: ${sucursalCentral.id})`);
  } else {
    console.log(`   ℹ️ Usando Sucursal Central existente (ID: ${sucursalCentral.id}, Nombre: "${sucursalCentral.nombre}")`);
  }

  let sucursalEquipetrol = await prisma.sucursal.findFirst({
    where: { nombre: { contains: 'Equipetrol' } },
  });

  if (!sucursalEquipetrol) {
    sucursalEquipetrol = await prisma.sucursal.create({
      data: {
        nombre: 'Sucursal Equipetrol',
        direccion: 'Av. San Martín #450, Barrio Equipetrol',
        telefono: '72223344',
        ciudad: 'Santa Cruz',
        activo: true,
      },
    });
    console.log(`   ✅ Creada Sucursal Equipetrol (ID: ${sucursalEquipetrol.id})`);
  } else {
    console.log(`   ℹ️ Usando Sucursal Equipetrol existente (ID: ${sucursalEquipetrol.id}, Nombre: "${sucursalEquipetrol.nombre}")`);
  }

  // ==========================================
  // 2. USUARIOS VENDEDORES
  // ==========================================
  console.log('👥 2. Configurando Usuarios Vendedores...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('vendedor123', salt);

  // Vendedor Central
  let vendedorCentral = await prisma.usuario.findFirst({
    where: { email: 'vendedor@centralphone.com' },
  });
  if (!vendedorCentral) {
    vendedorCentral = await prisma.usuario.create({
      data: {
        nombre: 'Yuli Mostrador',
        email: 'vendedor@centralphone.com',
        passwordHash,
        rol: RolUsuario.VENDEDOR,
        sucursalId: sucursalCentral.id,
        activo: true,
      },
    });
    console.log(`   ✅ Creado Vendedor Central: ${vendedorCentral.nombre}`);
  } else {
    if (vendedorCentral.sucursalId !== sucursalCentral.id) {
      vendedorCentral = await prisma.usuario.update({
        where: { id: vendedorCentral.id },
        data: { sucursalId: sucursalCentral.id },
      });
    }
    console.log(`   ℹ️ Vendedor Central existente: ${vendedorCentral.nombre}`);
  }

  // Vendedor Equipetrol
  let vendedorEquipetrol = await prisma.usuario.findFirst({
    where: { email: 'vendedor.equipetrol@centralphone.com' },
  });
  if (!vendedorEquipetrol) {
    vendedorEquipetrol = await prisma.usuario.create({
      data: {
        nombre: 'Carlos Vendedor Equipetrol',
        email: 'vendedor.equipetrol@centralphone.com',
        passwordHash,
        rol: RolUsuario.VENDEDOR,
        sucursalId: sucursalEquipetrol.id,
        activo: true,
      },
    });
    console.log(`   ✅ Creado Vendedor Equipetrol: ${vendedorEquipetrol.nombre}`);
  } else {
    console.log(`   ℹ️ Vendedor Equipetrol existente: ${vendedorEquipetrol.nombre}`);
  }

  // Admin
  const admin = await prisma.usuario.findFirst({
    where: { rol: RolUsuario.ADMIN },
  });
  const adminId = admin ? admin.id : vendedorCentral.id;

  // ==========================================
  // 3. PROVEEDORES MAYORISTAS
  // ==========================================
  console.log('📦 3. Verificando Proveedores Mayoristas...');
  const proveedoresNombres = ['Beby', 'Javier', 'Gabriela'];
  const proveedoresMap = new Map<string, number>();

  for (const nombre of proveedoresNombres) {
    let prov = await prisma.proveedor.findFirst({ where: { nombre } });
    if (!prov) {
      prov = await prisma.proveedor.create({
        data: {
          nombre,
          telefono: '77889900',
          contactoReferencia: `Mayorista oficial ${nombre}`,
        },
      });
    }
    proveedoresMap.set(nombre, prov.id);
  }
  const provIds = Array.from(proveedoresMap.values());

  // ==========================================
  // 4. MÉTODOS DE PAGO Y CATEGORÍAS DE GASTO
  // ==========================================
  console.log('💳 4. Verificando Métodos de Pago...');
  const metodosDef = [
    { codigo: 'EFECTIVO', nombre: 'Efectivo en Caja', tipoEstrategia: TipoEstrategiaPago.CASH },
    { codigo: 'QR_SIMPLE', nombre: 'QR Oficial BNB', tipoEstrategia: TipoEstrategiaPago.STATIC_QR },
    { codigo: 'TRANSFERENCIA', nombre: 'Transferencia Bancaria', tipoEstrategia: TipoEstrategiaPago.STATIC_QR },
  ];
  const metodosMap = new Map<string, number>();
  for (const m of metodosDef) {
    let mp = await prisma.metodoPago.findUnique({ where: { codigo: m.codigo } });
    if (!mp) {
      mp = await prisma.metodoPago.create({ data: m });
    }
    metodosMap.set(m.codigo, mp.id);
  }

  // Categorías de Gasto
  let catGastoComida = await prisma.categoriaGasto.upsert({
    where: { nombre: 'Alimentación/Turno' },
    update: {},
    create: { nombre: 'Alimentación/Turno' },
  });
  let catGastoTransp = await prisma.categoriaGasto.upsert({
    where: { nombre: 'Transporte/Envíos' },
    update: {},
    create: { nombre: 'Transporte/Envíos' },
  });

  // ==========================================
  // 5. CATÁLOGO DE MODELOS Y VARIANTES IPHONE
  // ==========================================
  console.log('📱 5. Verificando Catálogo de Dispositivos y Variantes...');
  const catalogoModelos = [
    {
      nombre: 'iPhone 11',
      costoUsd: 260,
      costoBs: 1810,
      precioBs: 2450,
      colores: ['Negro', 'Blanco', 'Morado'],
      capacidades: [64, 128],
    },
    {
      nombre: 'iPhone 12',
      costoUsd: 340,
      costoBs: 2366,
      precioBs: 3200,
      colores: ['Negro', 'Azul', 'Blanco'],
      capacidades: [128, 256],
    },
    {
      nombre: 'iPhone 13',
      costoUsd: 460,
      costoBs: 3201,
      precioBs: 4300,
      colores: ['Midnight', 'Starlight', 'Azul', 'Rosa'],
      capacidades: [128, 256],
    },
    {
      nombre: 'iPhone 13 Pro',
      costoUsd: 550,
      costoBs: 3828,
      precioBs: 5100,
      colores: ['Grafito', 'Sierra Blue', 'Oro'],
      capacidades: [128, 256, 512],
    },
    {
      nombre: 'iPhone 14',
      costoUsd: 560,
      costoBs: 3897,
      precioBs: 5200,
      colores: ['Medianoche', 'Luz Estelar', 'Azul'],
      capacidades: [128, 256],
    },
    {
      nombre: 'iPhone 14 Pro',
      costoUsd: 680,
      costoBs: 4732,
      precioBs: 6300,
      colores: ['Space Black', 'Deep Purple', 'Oro'],
      capacidades: [128, 256, 512],
    },
    {
      nombre: 'iPhone 15',
      costoUsd: 720,
      costoBs: 5011,
      precioBs: 6800,
      colores: ['Negro', 'Azul', 'Rosa', 'Verde'],
      capacidades: [128, 256],
    },
    {
      nombre: 'iPhone 15 Pro',
      costoUsd: 890,
      costoBs: 6194,
      precioBs: 8400,
      colores: ['Natural Titanium', 'Black Titanium', 'White Titanium'],
      capacidades: [128, 256, 512],
    },
    {
      nombre: 'iPhone 16',
      costoUsd: 860,
      costoBs: 5985,
      precioBs: 8000,
      colores: ['Negro', 'Blanco', 'Teal', 'Ultramarino'],
      capacidades: [128, 256],
    },
    {
      nombre: 'iPhone 16 Pro',
      costoUsd: 1050,
      costoBs: 7308,
      precioBs: 9800,
      colores: ['Desert Titanium', 'Natural Titanium', 'Black Titanium'],
      capacidades: [128, 256, 512],
    },
    {
      nombre: 'iPhone 16 Pro Max',
      costoUsd: 1200,
      costoBs: 8352,
      precioBs: 11200,
      colores: ['Desert Titanium', 'Natural Titanium', 'Black Titanium'],
      capacidades: [256, 512, 1024],
    },
  ];

  const variantesGeneradas: {
    varianteId: number;
    modeloNombre: string;
    costoUsd: number;
    costoBs: number;
    precioBs: number;
  }[] = [];

  for (const item of catalogoModelos) {
    let modelo = await prisma.modeloDispositivo.findFirst({
      where: { nombreModelo: item.nombre },
    });
    if (!modelo) {
      modelo = await prisma.modeloDispositivo.create({
        data: {
          nombreModelo: item.nombre,
          marca: 'Apple',
          descripcion: `Línea oficial Apple ${item.nombre}`,
        },
      });
    }

    for (const color of item.colores) {
      for (const cap of item.capacidades) {
        for (const tipoSim of ['SIM Físico', 'eSIM']) {
          let variante = await prisma.varianteDispositivo.findUnique({
            where: {
              modeloId_color_capacidadGb_tipoSim: {
                modeloId: modelo.id,
                color,
                capacidadGb: cap,
                tipoSim,
              },
            },
          });
          if (!variante) {
            variante = await prisma.varianteDispositivo.create({
              data: {
                modeloId: modelo.id,
                color,
                capacidadGb: cap,
                tipoSim,
              },
            });
          }
          variantesGeneradas.push({
            varianteId: variante.id,
            modeloNombre: item.nombre,
            costoUsd: item.costoUsd,
            costoBs: item.costoBs,
            precioBs: item.precioBs,
          });
        }
      }
    }
  }
  console.log(`   ✅ Variantes activas disponibles en catálogo: ${variantesGeneradas.length}`);

  // ==========================================
  // 6. CATÁLOGO BASE DE ACCESORIOS
  // ==========================================
  console.log('🎧 6. Configurando Catálogo Base de Accesorios...');
  const catFundas = await prisma.categoriaAccesorio.upsert({
    where: { nombre: 'Fundas y Carcasas' },
    update: {},
    create: { nombre: 'Fundas y Carcasas', descripcion: 'Silicona, MagSafe y Uso Rudo' },
  });
  const catCargadores = await prisma.categoriaAccesorio.upsert({
    where: { nombre: 'Cargadores y Cables' },
    update: {},
    create: { nombre: 'Cargadores y Cables', descripcion: 'Carga rápida 20W, cables trenzados' },
  });
  const catMicas = await prisma.categoriaAccesorio.upsert({
    where: { nombre: 'Láminas e Hidrogel' },
    update: {},
    create: { nombre: 'Láminas e Hidrogel', descripcion: 'Protectores de pantalla y micas de lente' },
  });

  const accesoriosBase = [
    { nombre: 'Funda Silicona Case iPhone', categoriaId: catFundas.id },
    { nombre: 'Funda MagSafe Reforzada Armor', categoriaId: catFundas.id },
    { nombre: 'Cabezal de Carga Rápida USB-C 20W', categoriaId: catCargadores.id },
    { nombre: 'Cable USB-C a Lightning 1m Trenzado', categoriaId: catCargadores.id },
    { nombre: 'Cable USB-C a USB-C 60W 1m', categoriaId: catCargadores.id },
    { nombre: 'Lámina Hidrogel HD Premium', categoriaId: catMicas.id },
    { nombre: 'Protector de Lente Cámara Zafiro', categoriaId: catMicas.id },
  ];

  const accesoriosMap = new Map<string, number>();
  for (const acc of accesoriosBase) {
    let a = await prisma.accesorio.findFirst({ where: { nombre: acc.nombre } });
    if (!a) {
      const maxAcc = await prisma.accesorio.findFirst({ orderBy: { id: 'desc' } });
      const nextId = (maxAcc?.id || 0) + 1;
      a = await prisma.accesorio.create({
        data: {
          id: nextId,
          nombre: acc.nombre,
          categoriaId: acc.categoriaId,
        },
      });
    }
    accesoriosMap.set(acc.nombre, a.id);
  }

  // ==========================================
  // 7. CLIENTES BASE (BOLIVIA)
  // ==========================================
  console.log('👤 7. Creando Clientes para el Año 2026...');
  const nombresBolivia = [
    'Mateo Roca Banegas', 'Mariana Suárez Justiniano', 'Carlos Eduardo Vaca',
    'Valeria Dorado Chávez', 'Sebastián Saucedo Hurtado', 'Luciana Banegas Melgar',
    'Andrés Justiniano Ortiz', 'Camila Mercado Ribera', 'Diego Fernando Soliz',
    'Valentina Torrico Flores', 'Rodrigo Cuéllar Añez', 'Sofía Hurtado Saucedo',
    'Alejandro Paz Cardona', 'Natalia Antelo Montero', 'Gabriel Rojas Mamani',
    'Daniela Céspedes Quiroga', 'Leonardo Justiniano Leaños', 'Paula Andrea Aguilera',
    'Ignacio Parada Justiniano', 'Fernanda Monasterio Rivero', 'Mauricio Rivero Vaca',
    'Adriana Salek Chávez', 'Fabián Justiniano Mercado', 'Renata Costas Aguilera',
    'Joaquín Peña Sandoval', 'Victoria Justiniano Roca', 'Nicolás Melgar Ribera',
    'Lucía Justiniano Saucedo', 'Martín Vaca Diez', 'Isabella Antelo Suárez',
    'Emilio Justiniano Melgar', 'Elena Roca Mercado', 'Bruno Banegas Banegas',
    'Clara Justiniano Antelo', 'Tomás Justiniano Vaca', 'Julieta Saucedo Roca',
    'Samuel Vaca Justiniano', 'Lucía Aguilera Justiniano', 'Esteban Justiniano Paz',
    'Macarena Hurtado Melgar'
  ];

  const clientesIds: number[] = [];
  for (let i = 0; i < nombresBolivia.length; i++) {
    const nombreCompleto = nombresBolivia[i];
    const telefono = `7${Math.floor(1000000 + Math.random() * 8999999)}`;
    const ciNit = `${Math.floor(5000000 + Math.random() * 4999999)}-SC`;

    let cliente = await prisma.cliente.findFirst({
      where: { nombreCompleto },
    });
    if (!cliente) {
      cliente = await prisma.cliente.create({
        data: {
          nombreCompleto,
          telefono,
          ciNit,
          creadoEn: new Date(2026, 0, 5 + (i % 20)),
        },
      });
    }
    clientesIds.push(cliente.id);
  }

  // Cliente casual estándar
  let clienteCasual = await prisma.cliente.findFirst({
    where: { nombreCompleto: 'Comprador casual' },
  });
  if (!clienteCasual) {
    clienteCasual = await prisma.cliente.create({
      data: {
        nombreCompleto: 'Comprador casual',
        telefono: '71000000',
        ciNit: '0',
      },
    });
  }
  clientesIds.push(clienteCasual.id);
  console.log(`   ✅ Clientes disponibles en base de datos: ${clientesIds.length}`);

  // ==========================================
  // 8. NOTAS DE INGRESO 2026 (RECEPCIÓN UNIFICADA)
  // ==========================================
  console.log('📥 8. Generando Notas de Ingreso (Enero a Septiembre 2026)...');
  const sucursales = [
    { sucursal: sucursalCentral, tag: 'CEN', vendedor: vendedorCentral },
    { sucursal: sucursalEquipetrol, tag: 'EQP', vendedor: vendedorEquipetrol },
  ];

  const notasIngresoIds: { sucursalId: number; notaId: number; fecha: Date }[] = [];

  // Fechas de recepción mensual a lo largo de 2026
  const fechasNotas2026 = [
    new Date('2026-01-08T10:00:00Z'),
    new Date('2026-02-12T11:30:00Z'),
    new Date('2026-03-15T09:15:00Z'),
    new Date('2026-04-18T14:00:00Z'),
    new Date('2026-05-20T10:45:00Z'),
    new Date('2026-06-22T16:20:00Z'),
    new Date('2026-07-25T11:00:00Z'),
    new Date('2026-08-28T15:30:00Z'),
    new Date('2026-09-20T10:00:00Z'),
  ];

  for (const s of sucursales) {
    for (let idx = 0; idx < fechasNotas2026.length; idx++) {
      const fecha = fechasNotas2026[idx];
      const provId = provIds[idx % provIds.length];
      const comprobante = `IMP-2026-${s.tag}-${(idx + 1).toString().padStart(3, '0')}`;

      let nota = await prisma.notaIngreso.findFirst({
        where: { numeroComprobante: comprobante },
      });

      if (!nota) {
        nota = await prisma.notaIngreso.create({
          data: {
            proveedorId: provId,
            sucursalId: s.sucursal.id,
            usuarioId: adminId,
            numeroComprobante: comprobante,
            fechaIngreso: fecha,
            totalCostoBs: 0, // Se actualizará al agregar dispositivos y lotes
            observaciones: `Lote de importación regular 2026 para ${s.sucursal.nombre} #${idx + 1}`,
          },
        });
      }
      notasIngresoIds.push({ sucursalId: s.sucursal.id, notaId: nota.id, fecha });
    }
  }
  console.log(`   ✅ Notas de ingreso creadas: ${notasIngresoIds.length}`);

  // ==========================================
  // 9. LOTES DE ACCESORIOS (40 LOTES EN 2026)
  // ==========================================
  console.log('📦 9. Generando Lotes de Accesorios Diferenciados por Sucursal...');
  const lotesConfig = [
    { acc: 'Funda Silicona Case iPhone', dif: 'Silicona Simple OEM Bs 35', costo: 15, venta: 35, cant: 50 },
    { acc: 'Funda Silicona Case iPhone', dif: 'Silicona Colores Mate Bs 45', costo: 20, venta: 45, cant: 40 },
    { acc: 'Funda MagSafe Reforzada Armor', dif: 'MagSafe Transparente Bs 100', costo: 45, venta: 100, cant: 35 },
    { acc: 'Funda MagSafe Reforzada Armor', dif: 'MagSafe Armor Antigolpes Bs 130', costo: 60, venta: 130, cant: 30 },
    { acc: 'Cabezal de Carga Rápida USB-C 20W', dif: 'Cargador 20W Calidad Original Bs 120', costo: 55, venta: 120, cant: 40 },
    { acc: 'Cabezal de Carga Rápida USB-C 20W', dif: 'Cargador 20W Apple Genuino Bs 180', costo: 95, venta: 180, cant: 25 },
    { acc: 'Cable USB-C a Lightning 1m Trenzado', dif: 'Cable Lightning Trenzado 1m Bs 50', costo: 22, venta: 50, cant: 50 },
    { acc: 'Cable USB-C a USB-C 60W 1m', dif: 'Cable USB-C a USB-C 60W Rápido Bs 60', costo: 28, venta: 60, cant: 45 },
    { acc: 'Lámina Hidrogel HD Premium', dif: 'Hidrogel Transparente HD Bs 35', costo: 12, venta: 35, cant: 60 },
    { acc: 'Lámina Hidrogel HD Premium', dif: 'Hidrogel Mate Antihuellas Bs 45', costo: 18, venta: 45, cant: 50 },
    { acc: 'Protector de Lente Cámara Zafiro', dif: 'Anillos de Lente Individuales Bs 50', costo: 20, venta: 50, cant: 40 },
    { acc: 'Protector de Lente Cámara Zafiro', dif: 'Protector Integral de Cámara Zafiro Bs 70', costo: 30, venta: 70, cant: 30 },
  ];

  const lotesCreados: { loteId: number; sucursalId: number; precioVentaBs: number; costoUnitarioBs: number }[] = [];

  for (const s of sucursales) {
    const notasSucursal = notasIngresoIds.filter((n) => n.sucursalId === s.sucursal.id);
    for (let i = 0; i < lotesConfig.length; i++) {
      const cfg = lotesConfig[i];
      const accId = accesoriosMap.get(cfg.acc)!;
      const nota = notasSucursal[i % notasSucursal.length];

      // Comprobar existencia
      let lote = await prisma.loteAccesorio.findFirst({
        where: {
          accesorioId: accId,
          sucursalId: s.sucursal.id,
          nombreDiferenciador: cfg.dif,
        },
      });

      if (!lote) {
        lote = await prisma.loteAccesorio.create({
          data: {
            accesorioId: accId,
            sucursalId: s.sucursal.id,
            notaIngresoId: nota.notaId,
            nombreDiferenciador: cfg.dif,
            costoUnitarioBs: cfg.costo,
            precioVentaBs: cfg.venta,
            cantidadInicial: cfg.cant,
            stockActual: cfg.cant,
            activo: true,
            fechaIngreso: nota.fecha,
          },
        });
      }
      lotesCreados.push({
        loteId: lote.id,
        sucursalId: s.sucursal.id,
        precioVentaBs: cfg.venta,
        costoUnitarioBs: cfg.costo,
      });
    }
  }
  console.log(`   ✅ Lotes de accesorios disponibles: ${lotesCreados.length}`);

  // ==========================================
  // 10. DISPOSITIVOS SERIALIZADOS (220 EQUIPOS)
  // ==========================================
  console.log('📱 10. Generando 220 Dispositivos Serializados (IMEIs y Series Únicas)...');
  const dispositivosCreados: {
    id: number;
    sucursalId: number;
    varianteId: number;
    costoBs: number;
    precioVentaSugeridoBs: number;
    fechaIngreso: Date;
  }[] = [];

  let deviceCounter = 1;
  const totalEquiposPorSucursal = 110;

  for (const s of sucursales) {
    const notasSucursal = notasIngresoIds.filter((n) => n.sucursalId === s.sucursal.id);

    for (let i = 1; i <= totalEquiposPorSucursal; i++) {
      const v = variantesGeneradas[(deviceCounter * 7) % variantesGeneradas.length];
      const nota = notasSucursal[i % notasSucursal.length];

      const serie = `CP26-${s.tag}-${deviceCounter.toString().padStart(4, '0')}`;
      const imei1 = `35987210${s.sucursal.id.toString().padStart(2, '0')}${deviceCounter.toString().padStart(5, '0')}`;
      const imei2 = `35987211${s.sucursal.id.toString().padStart(2, '0')}${deviceCounter.toString().padStart(5, '0')}`;

      // Condición verosímil: ~80% NUEVO, ~15% USADO, ~5% OPEN_BOX
      let condicion: CondicionDispositivo = CondicionDispositivo.NUEVO;
      if (i % 10 === 0) condicion = CondicionDispositivo.OPEN_BOX;
      else if (i % 6 === 0) condicion = CondicionDispositivo.USADO;

      let disp = await prisma.dispositivo.findUnique({
        where: { numeroSerie: serie },
      });

      if (!disp) {
        disp = await prisma.dispositivo.create({
          data: {
            varianteId: v.varianteId,
            sucursalId: s.sucursal.id,
            notaIngresoId: nota.notaId,
            numeroSerie: serie,
            imei1,
            imei2,
            condicion,
            costoBs: v.costoBs,
            costoUsd: v.costoUsd,
            precioVentaSugeridoBs: v.precioBs,
            estadoInventario: EstadoInventario.DISPONIBLE,
          },
        });
      }

      dispositivosCreados.push({
        id: disp.id,
        sucursalId: s.sucursal.id,
        varianteId: v.varianteId,
        costoBs: v.costoBs,
        precioVentaSugeridoBs: v.precioBs,
        fechaIngreso: nota.fecha,
      });

      deviceCounter++;
    }
  }
  console.log(`   ✅ Dispositivos serializados generados en inventario: ${dispositivosCreados.length}`);

  // ==========================================
  // 11. SESIONES DE CAJA DIARIA HISTÓRICAS (2026)
  // ==========================================
  console.log('💰 11. Generando Sesiones de Caja Diaria (Enero a Octubre 2026)...');
  // Generar 20 turnos por sucursal repartidos en 2026 (2 por mes)
  const cajasHistorial: {
    cajaId: number;
    sucursalId: number;
    usuarioId: number;
    fechaApertura: Date;
    fechaCierre: Date;
    montoInicial: number;
  }[] = [];

  for (const s of sucursales) {
    for (let mes = 0; mes <= 9; mes++) {
      // 2 turnos por mes: día 10 y día 25
      const dias = [10, 25];
      for (const d of dias) {
        // En octubre sólo hasta el 18 para dejar la sesión actual del 20 abierta
        if (mes === 9 && d > 18) continue;

        const fApertura = new Date(2026, mes, d, 8, 30, 0);
        const fCierre = new Date(2026, mes, d, 19, 30, 0);

        let caja = await prisma.cajaDiaria.findFirst({
          where: {
            sucursalId: s.sucursal.id,
            fechaApertura: fApertura,
          },
        });

        if (!caja) {
          caja = await prisma.cajaDiaria.create({
            data: {
              sucursalId: s.sucursal.id,
              usuarioAperturaId: s.vendedor.id,
              usuarioCierreId: s.vendedor.id,
              fechaApertura: fApertura,
              fechaCierre: fCierre,
              montoInicialEfectivo: 500.00,
              montoTeoricoEfectivo: 500.00,
              montoFinalEfectivo: 500.00,
              diferenciaEfectivo: 0.00,
              estado: EstadoCaja.CERRADA,
              observaciones: `Cierre de turno habitual ${d}/${mes + 1}/2026 sin incidentes.`,
            },
          });
        }

        cajasHistorial.push({
          cajaId: caja.id,
          sucursalId: s.sucursal.id,
          usuarioId: s.vendedor.id,
          fechaApertura: fApertura,
          fechaCierre: fCierre,
          montoInicial: 500.00,
        });
      }
    }

    // Caja Abierta Activa para Hoy (20 de Octubre de 2026)
    const hoyApertura = new Date('2026-10-20T08:30:00Z');
    let cajaActivaHoy = await prisma.cajaDiaria.findFirst({
      where: {
        sucursalId: s.sucursal.id,
        usuarioAperturaId: s.vendedor.id,
        estado: EstadoCaja.ABIERTA,
      },
    });

    if (!cajaActivaHoy) {
      cajaActivaHoy = await prisma.cajaDiaria.create({
        data: {
          sucursalId: s.sucursal.id,
          usuarioAperturaId: s.vendedor.id,
          fechaApertura: hoyApertura,
          montoInicialEfectivo: 600.00,
          estado: EstadoCaja.ABIERTA,
          observaciones: `Turno actual abierto para ventas en ${s.sucursal.nombre}`,
        },
      });
      console.log(`   🟢 Caja ABIERTA para hoy en ${s.sucursal.nombre} (ID: ${cajaActivaHoy.id})`);
    } else {
      console.log(`   ℹ️ Caja ABIERTA existente en ${s.sucursal.nombre} (ID: ${cajaActivaHoy.id})`);
    }
  }
  console.log(`   ✅ Turnos de caja histórica configurados: ${cajasHistorial.length}`);

  // ==========================================
  // 12. GASTOS OPERATIVOS DE CAJA HISTÓRICOS
  // ==========================================
  console.log('💸 12. Añadiendo Gastos Menores Operativos a Cajas...');
  const metodoEfecId = metodosMap.get('EFECTIVO')!;
  for (let i = 0; i < cajasHistorial.length; i += 3) {
    const c = cajasHistorial[i];
    const fechaGasto = new Date(c.fechaApertura.getTime() + 4 * 3600 * 1000); // 4 horas después de abrir

    const gastoExists = await prisma.gastoOperativo.findFirst({
      where: { cajaId: c.cajaId },
    });

    if (!gastoExists) {
      await prisma.gastoOperativo.create({
        data: {
          cajaId: c.cajaId,
          categoriaId: (i % 2 === 0) ? catGastoComida.id : catGastoTransp.id,
          usuarioId: c.usuarioId,
          metodoPagoId: metodoEfecId,
          montoBs: 35.00,
          concepto: (i % 2 === 0) ? 'Almuerzo de turno de mostrador' : 'Envío en mototaxi mercadería urgente',
          fechaHora: fechaGasto,
        },
      });
    }
  }

  // ==========================================
  // 13. VENTAS Y DETALLE DE VENTAS (AÑO 2026)
  // ==========================================
  console.log('🛒 13. Generando 160 Ventas y Detalle Transaccional en 3FN...');
  const metodosCodigos = ['EFECTIVO', 'QR_SIMPLE', 'TRANSFERENCIA'];

  let ventasGeneradas = 0;
  let detallesGenerados = 0;
  let dispositivosVendidosCount = 0;

  // Repartir 80 ventas en Central y 80 ventas en Equipetrol
  for (const s of sucursales) {
    const cajasSucursal = cajasHistorial.filter((c) => c.sucursalId === s.sucursal.id);
    const dispositivosSucursal = dispositivosCreados.filter((d) => d.sucursalId === s.sucursal.id);
    const lotesSucursal = lotesCreados.filter((l) => l.sucursalId === s.sucursal.id);

    let dispIdx = 0;

    for (let vIdx = 0; vIdx < 80; vIdx++) {
      const caja = cajasSucursal[vIdx % cajasSucursal.length];
      const clienteId = clientesIds[(vIdx * 3 + s.sucursal.id) % clientesIds.length];

      // Hora de la venta dentro del turno de caja (entre 09:00 y 19:00)
      const minutosRandom = Math.floor(30 + Math.random() * 540);
      const fechaVenta = new Date(caja.fechaApertura.getTime() + minutosRandom * 60 * 1000);

      // Método de pago: 45% Efectivo, 40% QR, 15% Transferencia
      let metodoCodigo = 'EFECTIVO';
      const r = Math.random();
      if (r > 0.6) metodoCodigo = 'QR_SIMPLE';
      else if (r > 0.45) metodoCodigo = 'TRANSFERENCIA';
      const metodoPagoId = metodosMap.get(metodoCodigo)!;

      const compRef = (metodoCodigo !== 'EFECTIVO') ? `BNB-2026-${s.tag}-${(vIdx + 1000)}` : null;

      // Determinar tipo de venta:
      // ~50 ventas de iPhone solo
      // ~20 ventas de iPhone + 1 a 2 accesorios
      // ~10 ventas de solo accesorios
      const esVentaTelefono = vIdx < 70 && dispIdx < dispositivosSucursal.length;
      const incluyeAccesorios = (vIdx >= 50 && vIdx < 70) || (vIdx >= 70);

      // Crear la Venta
      const venta = await prisma.venta.create({
        data: {
          cajaId: caja.cajaId,
          usuarioId: s.vendedor.id,
          clienteId,
          metodoPagoId,
          fechaHora: fechaVenta,
          totalVentaBs: 0, // Se computa en base a los detalles
          comprobanteReferencia: compRef,
          estado: EstadoVenta.COMPLETADA,
        },
      });
      ventasGeneradas++;

      let totalVentaCalculado = 0;

      // 1. Agregar Dispositivo si aplica
      if (esVentaTelefono) {
        const disp = dispositivosSucursal[dispIdx++];
        await prisma.detalleVenta.create({
          data: {
            ventaId: venta.id,
            tipoItem: TipoItemVenta.DISPOSITIVO,
            dispositivoId: disp.id,
            cantidad: 1,
            costoUnitarioBs: disp.costoBs,
            precioUnitarioBs: disp.precioVentaSugeridoBs,
            subtotalBs: disp.precioVentaSugeridoBs,
          },
        });
        detallesGenerados++;
        totalVentaCalculado += Number(disp.precioVentaSugeridoBs);

        // Actualizar estado del dispositivo a VENDIDO
        await prisma.dispositivo.update({
          where: { id: disp.id },
          data: { estadoInventario: EstadoInventario.VENDIDO },
        });
        dispositivosVendidosCount++;
      }

      // 2. Agregar Accesorios si aplica
      if (incluyeAccesorios) {
        const numAcc = 1 + (vIdx % 2); // 1 o 2 accesorios
        for (let a = 0; a < numAcc; a++) {
          const lote = lotesSucursal[(vIdx * 2 + a) % lotesSucursal.length];
          const cant = 1;

          await prisma.detalleVenta.create({
            data: {
              ventaId: venta.id,
              tipoItem: TipoItemVenta.ACCESORIO,
              loteAccesorioId: lote.loteId,
              cantidad: cant,
              costoUnitarioBs: lote.costoUnitarioBs,
              precioUnitarioBs: lote.precioVentaBs,
              subtotalBs: lote.precioVentaBs * cant,
            },
          });
          detallesGenerados++;
          totalVentaCalculado += (lote.precioVentaBs * cant);

          // Reducir stock del lote de accesorios
          await prisma.loteAccesorio.update({
            where: { id: lote.loteId },
            data: {
              stockActual: {
                decrement: cant,
              },
            },
          });
        }
      }

      // Actualizar el total de la Venta
      await prisma.venta.update({
        where: { id: venta.id },
        data: { totalVentaBs: totalVentaCalculado },
      });
    }
  }

  // ==========================================
  // 14. BALANCE Y ARQUEO DE CAJAS CERRADAS
  // ==========================================
  console.log('⚖️ 14. Cuadrando Balances Financieros y Arqueos Ciegos de Cajas...');
  for (const c of cajasHistorial) {
    // Sumar ventas en efectivo
    const ventasEfectivo = await prisma.venta.findMany({
      where: {
        cajaId: c.cajaId,
        metodoPago: { codigo: 'EFECTIVO' },
        estado: EstadoVenta.COMPLETADA,
      },
    });
    const totalEfec = ventasEfectivo.reduce((sum, v) => sum + Number(v.totalVentaBs), 0);

    // Sumar gastos en efectivo
    const gastosEfec = await prisma.gastoOperativo.findMany({
      where: {
        cajaId: c.cajaId,
        metodoPago: { codigo: 'EFECTIVO' },
      },
    });
    const totalGastos = gastosEfec.reduce((sum, g) => sum + Number(g.montoBs), 0);

    const saldoTeorico = c.montoInicial + totalEfec - totalGastos;

    // En 95% de los turnos el vendedor contó exacto; en algunos hay pequeña diferencia de monedas
    let diferencia = 0.00;
    let justificacion = 'Arqueo físico conforme sin diferencias de gaveta.';
    if (c.cajaId % 7 === 0) {
      diferencia = 10.00;
      justificacion = 'Sobrante menor por redondeo de cambio en venta de accesorios.';
    } else if (c.cajaId % 11 === 0) {
      diferencia = -5.00;
      justificacion = 'Faltante de Bs 5 en monedas de cambio.';
    }

    const saldoFinalConteo = saldoTeorico + diferencia;

    await prisma.cajaDiaria.update({
      where: { id: c.cajaId },
      data: {
        montoTeoricoEfectivo: saldoTeorico,
        montoFinalEfectivo: saldoFinalConteo,
        diferenciaEfectivo: diferencia,
        justificacion,
      },
    });
  }

  // ==========================================
  // 15. ACTUALIZAR TOTALES DE NOTAS DE INGRESO
  // ==========================================
  console.log('🧾 15. Consolidando Costos Totales en Notas de Ingreso...');
  for (const n of notasIngresoIds) {
    const disps = await prisma.dispositivo.findMany({ where: { notaIngresoId: n.notaId } });
    const lotes = await prisma.loteAccesorio.findMany({ where: { notaIngresoId: n.notaId } });

    const totalCosto = disps.reduce((acc, d) => acc + Number(d.costoBs), 0) +
                       lotes.reduce((acc, l) => acc + (Number(l.costoUnitarioBs) * l.cantidadInicial), 0);

    await prisma.notaIngreso.update({
      where: { id: n.notaId },
      data: { totalCostoBs: totalCosto },
    });
  }

  // ==========================================
  // RESUMEN FINAL
  // ==========================================
  console.log('\n======================================================');
  console.log('🎉 [SIMULATION 2026] DATASET GENERADO CON ÉXITO');
  console.log('======================================================');
  console.log(`🏢 Sucursales operativas:          2 (Sucursal Central y Sucursal Equipetrol)`);
  console.log(`👤 Vendedores activos:             2 (Yuli Mostrador y Carlos Equipetrol)`);
  console.log(`📥 Notas de Ingreso (Recepción):   ${notasIngresoIds.length}`);
  console.log(`📱 Dispositivos serializados:      ${dispositivosCreados.length} (Disponibles: ${dispositivosCreados.length - dispositivosVendidosCount}, Vendidos: ${dispositivosVendidosCount})`);
  console.log(`📦 Lotes de accesorios activos:    ${lotesCreados.length}`);
  console.log(`👥 Clientes registrados:           ${clientesIds.length}`);
  console.log(`💰 Turnos de Caja Diaria (2026):   ${cajasHistorial.length + 2} (Historial cerrado + 2 cajas abiertas hoy)`);
  console.log(`🛒 Ventas completadas 2026:        ${ventasGeneradas}`);
  console.log(`📄 Líneas de Detalle de Venta:     ${detallesGenerados}`);
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la generación del dataset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
