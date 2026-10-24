import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { ModelosModule } from './modelos/modelos.module';
import { AccesoriosModule } from './accesorios/accesorios.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { RecepcionModule } from './recepcion/recepcion.module';
import { CajaModule } from './caja/caja.module';
import { VentasModule } from './ventas/ventas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsuariosModule,
    SucursalesModule,
    ConfiguracionModule,
    ModelosModule,
    AccesoriosModule,
    ProveedoresModule,
    RecepcionModule,
    CajaModule,
    VentasModule,
  ],
})
export class AppModule {}
