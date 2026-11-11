import { Module } from '@nestjs/common';
import { RecepcionService } from './recepcion.service';
import { RecepcionController } from './recepcion.controller';
import { ConfiguracionModule } from '../configuracion/configuracion.module';

@Module({
  imports: [ConfiguracionModule],
  controllers: [RecepcionController],
  providers: [RecepcionService],
  exports: [RecepcionService],
})
export class RecepcionModule {}
