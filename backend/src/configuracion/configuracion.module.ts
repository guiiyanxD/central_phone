import { Module } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { ConfiguracionController } from './configuracion.controller';
import { ImageOptimizerService } from '../common/services/image-optimizer.service';

@Module({
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService, ImageOptimizerService],
  exports: [ConfiguracionService, ImageOptimizerService],
})
export class ConfiguracionModule {}
