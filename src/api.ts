import express from 'express';
import cors from 'cors';
import { DatabaseService } from './database';
import { UserOperationFilter } from './types';
import { serializeBigInt } from './utils';
import { CacheService } from './cache';
import { metricsService } from '.';

export function setupAPI(db: DatabaseService, port: number = 3000) {
  const app = express();
  const operationsCache = new CacheService(30);
  
  app.use(cors());
  app.use(express.json());

  app.get('/metrics', async (req, res) => {
    const metrics = await metricsService.getMetrics();
    res.json(metrics);
  });

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      metricsService.observeHttpRequestDuration(
        { method: req.method, route: req.route?.path || req.path, status: res.statusCode.toString() },
        duration
      );
    });
    next();
  });

  //@ts-ignore
  app.get('/api/operations', async (req, res) => {
    try {
      const cachedOperations = operationsCache.get('all_operations');
      if (cachedOperations) {
        return res.status(200).json(cachedOperations);
      }

      const operations = await db.getAllUserOperations();
      const serializedOperations = serializeBigInt(operations);
      operationsCache.set('all_operations', serializedOperations);
      res.status(200).json(serializedOperations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch operations' });
    }
  });
    
  //@ts-ignore
  app.get('/api/operations/:hash', async (req, res) => {
    try {
      const cacheKey = `operation_${req.params.hash}`;
      const cachedOperation = operationsCache.get(cacheKey);
      if (cachedOperation) {
        return res.status(200).json(cachedOperation);
      }

      const operation = await db.getUserOperation(req.params.hash);
      if (!operation) {
        return res.status(404).json({ error: 'Operation not found' });
      }
      
      const serializedOperation = serializeBigInt(operation);
      operationsCache.set(cacheKey, serializedOperation);
      res.status(200).json(serializedOperation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch operation' });
    }
  });

  //@ts-ignore
  app.post('/api/operations/search', async (req, res) => {
    try {
      const filter: UserOperationFilter = req.body;
      const cacheKey = `search_${JSON.stringify(filter)}`;
      
      const cachedResults = operationsCache.get(cacheKey);
      if (cachedResults) {
        return res.status(200).json(cachedResults);
      }

      const operations = await db.searchUserOperations(filter);
      const serializedOperations = serializeBigInt(operations);
      operationsCache.set(cacheKey, serializedOperations);
      res.status(200).json(serializedOperations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to search operations' });
    }
  });

  app.listen(port, () => {
    console.log(`API server running on port ${port}`);
  });

  return app;
} 