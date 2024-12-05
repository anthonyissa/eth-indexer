import Database from 'better-sqlite3';
import { UserOperationEvent, UserOperationFilter } from './types';
import { metricsService } from '.';

export class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database('indexer.db');
    this.initialize();
    this.initializeMetricsTable();
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_operations (
        userOpHash TEXT PRIMARY KEY,
        sender TEXT NOT NULL,
        paymaster TEXT NOT NULL,
        nonce TEXT NOT NULL,
        success INTEGER NOT NULL,
        actualGasCost TEXT NOT NULL,
        actualGasUsed TEXT NOT NULL,
        blockNumber INTEGER NOT NULL,
        transactionHash TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);
  }

  initializeMetricsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        labels TEXT,
        value REAL NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);
  }

  async saveUserOperation(event: UserOperationEvent) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_operations (
        userOpHash, sender, paymaster, nonce, success, 
        actualGasCost, actualGasUsed, blockNumber, 
        transactionHash, timestamp
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      event.userOpHash,
      event.sender,
      event.paymaster,
      event.nonce.toString(),
      event.success ? 1 : 0,
      event.actualGasCost.toString(),
      event.actualGasUsed.toString(),
      event.blockNumber,
      event.transactionHash,
      Math.floor(Date.now() / 1000)
    );
  }

  async getUserOperation(userOpHash: string): Promise<UserOperationEvent | null> {
    const start = Date.now();
    try {
      const stmt = this.db.prepare('SELECT * FROM user_operations WHERE userOpHash = ?');
      const result = stmt.get(userOpHash) as UserOperationEvent | undefined;
      
      return result ? {
        userOpHash: result.userOpHash,
        sender: result.sender,
        paymaster: result.paymaster,
        nonce: BigInt(result.nonce),
        success: Boolean(result.success),
        actualGasCost: BigInt(result.actualGasCost),
        actualGasUsed: BigInt(result.actualGasUsed),
        blockNumber: result.blockNumber,
        transactionHash: result.transactionHash
      } : null;
    } finally {
      metricsService.dbQueryDuration.observe(
        { operation: 'getUserOperation' },
        (Date.now() - start) / 1000
      );
    }
  }

  async getAllUserOperations(): Promise<UserOperationEvent[]> {
    const stmt = this.db.prepare('SELECT * FROM user_operations ORDER BY timestamp DESC');
    const results = stmt.all() as UserOperationEvent[];
    
    return results.map(result => ({
      userOpHash: result.userOpHash,
      sender: result.sender,
      paymaster: result.paymaster,
      nonce: BigInt(result.nonce),
      success: Boolean(result.success),
      actualGasCost: BigInt(result.actualGasCost),
      actualGasUsed: BigInt(result.actualGasUsed),
      blockNumber: result.blockNumber,
      transactionHash: result.transactionHash
    }));
  }

  async searchUserOperations(filter: UserOperationFilter): Promise<UserOperationEvent[]> {
    let query = 'SELECT * FROM user_operations WHERE 1=1';
    const params: any[] = [];

    if (filter.userOpHash) {
      query += ' AND userOpHash = ?';
      params.push(filter.userOpHash);
    }

    if (filter.sender) {
      query += ' AND sender = ?';
      params.push(filter.sender);
    }

    if (filter.paymaster) {
      query += ' AND paymaster = ?';
      params.push(filter.paymaster);
    }

    if (filter.fromBlock !== undefined) {
      query += ' AND blockNumber >= ?';
      params.push(filter.fromBlock);
    }

    if (filter.toBlock !== undefined) {
      query += ' AND blockNumber <= ?';
      params.push(filter.toBlock);
    }

    if (filter.success !== undefined) {
      query += ' AND success = ?';
      params.push(filter.success ? 1 : 0);
    }

    query += ' ORDER BY blockNumber DESC';

    const stmt = this.db.prepare(query);
    const results = stmt.all(...params) as UserOperationEvent[];

    return results.map(result => ({
      userOpHash: result.userOpHash,
      sender: result.sender,
      paymaster: result.paymaster,
      nonce: BigInt(result.nonce),
      success: Boolean(result.success),
      actualGasCost: BigInt(result.actualGasCost),
      actualGasUsed: BigInt(result.actualGasUsed),
      blockNumber: result.blockNumber,
      transactionHash: result.transactionHash
    }));
  }

  saveMetric(name: string, labels: Record<string, string>, value: number) {
    const stmt = this.db.prepare(`
      INSERT INTO metrics (name, labels, value, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      name,
      JSON.stringify(labels),
      value,
      Math.floor(Date.now() / 1000)
    );
  }
} 
