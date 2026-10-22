import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

export type MockPrismaService = any;

export const createPrismaMock = (): any => {
  const mock = mockDeep<PrismaClient>();
  // Configurar comportamiento por defecto de transacciones interactivas
  mock.$transaction.mockImplementation(async (callback: any) => {
    if (typeof callback === 'function') {
      return callback(mock);
    }
    return callback;
  });
  mock.dispositivo.updateMany.mockResolvedValue({ count: 1 } as any);
  mock.loteAccesorio.updateMany.mockResolvedValue({ count: 1 } as any);
  return mock;
};
