import { DatabaseService } from './database';
import { CacheService } from './cache';

// Mock better-sqlite3
jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    exec: jest.fn(),
    prepare: jest.fn().mockReturnValue({
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    })
  }));
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 