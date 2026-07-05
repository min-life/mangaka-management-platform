import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis;
  private defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.defaultTtl = this.configService.get<number>('REDIS_TTL') || 300;
  }

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
      keyPrefix: this.configService.get<string>('REDIS_PREFIX', ''), // Prefix to separate devs' cache
      enableOfflineQueue: false, // Bypass Redis immediately if disconnected
      connectTimeout: 5000,
      maxRetriesPerRequest: 1, // Only retry once before throwing error
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis error', err);
    });
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.warn(`Failed to get cache for key ${key}: ${error.message}`);
      return null; // Return null on error to fallback to DB
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds ?? this.defaultTtl;
      await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      this.logger.warn(`Failed to set cache for key ${key}: ${error.message}`);
    }
  }

  async del(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      const keysToDelete: string[] = [];

      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          keysToDelete.push(...keys);
        }
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await this.redisClient.del(...keysToDelete);
        this.logger.debug(`Deleted ${keysToDelete.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete cache pattern ${pattern}: ${error.message}`);
    }
  }

  async delMultiple(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      await this.del(pattern);
    }
  }
}
