import request from 'supertest';
import { setupAPI } from '../api';
import { DatabaseService } from '../database';
import { UserOperationEvent } from '../types';

jest.mock('../database');

describe('API Endpoints', () => {
  let app: Express.Application;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = new DatabaseService() as jest.Mocked<DatabaseService>;
    app = setupAPI(mockDb, 3001);
  });

  describe('GET /api/operations', () => {
    test('should return all operations', async () => {
      const mockOperations: UserOperationEvent[] = [{
        userOpHash: '0x123',
        sender: '0xabc',
        paymaster: '0xdef',
        nonce: BigInt(1),
        success: true,
        actualGasCost: BigInt(1000),
        actualGasUsed: BigInt(2000),
        blockNumber: 123,
        transactionHash: '0x456'
      }];

      mockDb.getAllUserOperations.mockResolvedValue(mockOperations);

      const response = await request(app as any)
        .get('/api/operations')
        .expect(200);

      expect(response.body).toBeTruthy();
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should handle errors', async () => {
      mockDb.getAllUserOperations.mockRejectedValue(new Error('Database error'));

      const response = await request(app as any)
        .get('/api/operations')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch operations');
    });
  });

  describe('GET /api/operations/:hash', () => {
    test('should return operation by hash', async () => {
      const mockOperation: UserOperationEvent = {
        userOpHash: '0x123',
        sender: '0xabc',
        paymaster: '0xdef',
        nonce: BigInt(1),
        success: true,
        actualGasCost: BigInt(1000),
        actualGasUsed: BigInt(2000),
        blockNumber: 123,
        transactionHash: '0x456'
      };

      mockDb.getUserOperation.mockResolvedValue(mockOperation);

      const response = await request(app as any)
        .get('/api/operations/0x123')
        .expect(200);

      expect(response.body.userOpHash).toBe('0x123');
    });

    test('should return 404 for non-existent operation', async () => {
      mockDb.getUserOperation.mockResolvedValue(null);

      await request(app as any)
        .get('/api/operations/0x999')
        .expect(404);
    });
  });
}); 