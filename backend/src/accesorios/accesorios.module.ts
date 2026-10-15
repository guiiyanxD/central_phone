import { Module } from '@nestjs/common';
import { AccesoriosService } from './accesorios.service';
import { AccesoriosController } from './accesorios.controller';

@Module({
  controllers: [AccesoriosController],
  providers: [AccesoriosService],
  exports: [AccesoriosService],
})
export class AccesoriosModule {}
