import { Registry, Counter, Histogram } from 'prom-client';
import { DatabaseService } from './database';

export class MetricsService {
  private registry: Registry;
  private db: DatabaseService;
  public httpRequestDuration: Histogram;
  public httpRequestTotal: Counter;
  public cacheHits: Counter;
  public cacheMisses: Counter;
  public dbQueryDuration: Histogram;

  constructor(db: DatabaseService) {
    this.registry = new Registry();
    this.db = db;

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5]
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status']
    });

    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_key']
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_key']
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1]
    });

    this.registry.registerMetric(this.httpRequestDuration);
    this.registry.registerMetric(this.httpRequestTotal);
    this.registry.registerMetric(this.cacheHits);
    this.registry.registerMetric(this.cacheMisses);
    this.registry.registerMetric(this.dbQueryDuration);
  }

  async getMetrics(): Promise<{
    httpRequestDuration: { [key: string]: number[] };
    httpRequestTotal: { [key: string]: number };
    cacheHits: { [key: string]: number };
    cacheMisses: { [key: string]: number };
    dbQueryDuration: { [key: string]: number[] };
  }> {
    const metrics = {
      httpRequestDuration: {},
      httpRequestTotal: {},
      cacheHits: {},
      cacheMisses: {},
      dbQueryDuration: {}
    };

    const httpDurationData = await this.httpRequestDuration.get();
    metrics.httpRequestDuration = httpDurationData.values;

    const httpTotalData = await this.httpRequestTotal.get();
    metrics.httpRequestTotal = httpTotalData.values;

    const cacheHitsData = await this.cacheHits.get();
    metrics.cacheHits = cacheHitsData.values;

    const cacheMissesData = await this.cacheMisses.get();
    metrics.cacheMisses = cacheMissesData.values;

    const dbDurationData = await this.dbQueryDuration.get();
    metrics.dbQueryDuration = dbDurationData.values;

    return metrics;
  }

  recordMetric(name: string, labels: Record<string, string>, value: number) {
    this.db.saveMetric(name, labels, value);
  }

  observeHttpRequestDuration(labels: Record<string, string>, duration: number) {
    this.httpRequestDuration.observe(labels, duration);
    this.recordMetric('http_request_duration_seconds', labels, duration);
  }
  
}
