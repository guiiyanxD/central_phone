import { Test, TestingModule } from '@nestjs/testing';
import { ImageOptimizerService } from './image-optimizer.service';
import * as fs from 'fs';
import * as path from 'path';

describe('ImageOptimizerService', () => {
  let service: ImageOptimizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageOptimizerService],
    }).compile();

    service = module.get<ImageOptimizerService>(ImageOptimizerService);
  });

  it('debe instanciarse correctamente', () => {
    expect(service).toBeDefined();
    expect(service.getUploadsDirectory()).toBeDefined();
    expect(service.getQrDirectory()).toContain('qr');
  });

  it('debe leer la imagen persistida si el archivo existe en disco', () => {
    const qrDir = service.getQrDirectory();
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }
    const testFile = path.join(qrDir, 'qr_oficial.png');
    const dummyBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    fs.writeFileSync(testFile, dummyBuffer);

    const res = service.readPersistedQrImage();
    expect(res).toBeDefined();
    expect(res).toContain('data:image/png;base64,');
  });

  it('debe retornar null si la imagen no existe en disco', () => {
    const nonExistentService = new ImageOptimizerService();
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    const res = nonExistentService.readPersistedQrImage();
    expect(res).toBeNull();
  });
});
