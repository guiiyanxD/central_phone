import { Module } from '@nestjs/common';
import { CajaService } from './caja.service';
import { CajaController } from './caja.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { VentasModule } from '../ventas/ventas.module';

@Module({
  imports: [PrismaModule, VentasModule],
  controllers: [CajaController],
  providers: [CajaService],
  exports: [CajaService],
})
export class CajaModule {}

