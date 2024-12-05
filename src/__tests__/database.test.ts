import { DatabaseService } from '../database';
import { UserOperationEvent } from '../types';

describe('DatabaseService', () => {
  let db: DatabaseService;

  beforeEach(() => {
    db = new DatabaseService();
  });

  test('should initialize tables on construction', () => {
    expect(db['db'].exec).toHaveBeenCalledTimes(2);
  });

  test('should save user operation', async () => {
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

    await db.saveUserOperation(mockOperation);
    expect(db['db'].prepare).toHaveBeenCalled();
  });

  test('should get user operation by hash', async () => {
    const mockResult = {
      userOpHash: '0x123',
      sender: '0xabc',
      paymaster: '0xdef',
      nonce: '1',
      success: 1,
      actualGasCost: '1000',
      actualGasUsed: '2000',
      blockNumber: 123,
      transactionHash: '0x456'
    };

    const preparedStatement = db['db'].prepare('SELECT * FROM user_operations WHERE userOpHash = ?');
    jest.spyOn(preparedStatement, 'get').mockReturnValue(mockResult);

    const result = await db.getUserOperation('0x123');
    expect(result).toBeTruthy();
    expect(result?.userOpHash).toBe('0x123');
  });
  test('should return null for non-existent operation', async () => {
    const preparedStatement = db['db'].prepare('SELECT * FROM user_operations WHERE userOpHash = ?');
    jest.spyOn(preparedStatement, 'get').mockReturnValue(undefined);
    
    const result = await db.getUserOperation('0x999');
    expect(result).toBeNull();
  });
}); 