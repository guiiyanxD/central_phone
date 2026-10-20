import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Soporte universal para interoperabilidad CJS/ESM en NestJS y Jest
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharpModule = require('sharp');
const sharp = typeof sharpModule === 'function' ? sharpModule : sharpModule.default;

export interface OptimizedImageResult {
  filePath: string;
  dataUri: string;
  sizeBytes: number;
  width: number;
  height: number;
  format: string;
}

@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
  }

  getUploadsDirectory(): string {
    return this.uploadsDir;
  }

  getQrDirectory(): string {
    return path.join(this.uploadsDir, 'qr');
  }

  ensureDirectoriesExist(): void {
    const qrDir = this.getQrDirectory();
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
  }

  /**
   * Optimiza una imagen de código QR con Sharp:
   * 1. Redimensiona a un máximo de 800x800 manteniendo aspect ratio y sin distorsión.
   * 2. Purga metadatos EXIF / ICC / comentarios maliciosos.
   * 3. Aplica compresión PNG nivel 9 sin pérdida de contraste para lectura óptica por cámaras.
   * 4. Escribe el archivo físico en el Host Bind Mount (/app/uploads/qr/qr_oficial.png).
   * 5. Retorna el Data URI y estadísticas de compresión.
   */
  async processAndSaveQrImage(input: string | Buffer): Promise<OptimizedImageResult> {
    this.ensureDirectoriesExist();

    let inputBuffer: Buffer;
    if (Buffer.isBuffer(input)) {
      inputBuffer = input;
    } else if (typeof input === 'string') {
      let base64Data = input.trim();
      if (base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1];
      }
      inputBuffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new BadRequestException('Formato de imagen inválido.');
    }

    try {
      const originalMetadata = await sharp(inputBuffer).metadata();
      if (!originalMetadata.format) {
        throw new BadRequestException('El archivo no corresponde a una imagen válida.');
      }

      // Procesar y optimizar con Sharp
      const optimizedBuffer = await sharp(inputBuffer)
        .resize({
          width: 800,
          height: 800,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          force: true,
        })
        .toBuffer();

      const optimizedMeta = await sharp(optimizedBuffer).metadata();
      const targetFilePath = path.join(this.getQrDirectory(), 'qr_oficial.png');

      await fs.promises.writeFile(targetFilePath, optimizedBuffer);

      this.logger.log(
        `✅ QR optimizado con Sharp y persistido en ${targetFilePath} (${optimizedBuffer.length} bytes, original: ${inputBuffer.length} bytes)`,
      );

      const dataUri = `data:image/png;base64,${optimizedBuffer.toString('base64')}`;

      return {
        filePath: targetFilePath,
        dataUri,
        sizeBytes: optimizedBuffer.length,
        width: optimizedMeta.width || 800,
        height: optimizedMeta.height || 800,
        format: 'png',
      };
    } catch (err: any) {
      this.logger.error(`Error al optimizar imagen QR con sharp: ${err.message}`);
      throw new BadRequestException(`No se pudo procesar la imagen: ${err.message}`);
    }
  }

  /**
   * Intenta leer el archivo físico de QR persistido en disco (Host Bind Mount).
   * Retorna el Data URI correspondiente o null si el archivo no existe.
   */
  readPersistedQrImage(): string | null {
    const qrPath = path.join(this.getQrDirectory(), 'qr_oficial.png');
    if (fs.existsSync(qrPath)) {
      try {
        const fileBuffer = fs.readFileSync(qrPath);
        if (fileBuffer.length > 0) {
          return `data:image/png;base64,${fileBuffer.toString('base64')}`;
        }
      } catch (err: any) {
        this.logger.warn(`No se pudo leer ${qrPath}: ${err.message}`);
      }
    }
    return null;
  }
}
