import { Logger } from '@nestjs/common';
import { hashQuery } from '../utils/cache.util';

const logger = new Logger('CacheDecorator');

export function UseCache(keyPrefix: string | ((args: any[]) => string)) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = (this as any).cacheService;
      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      const prefix = typeof keyPrefix === 'function' ? keyPrefix(args) : keyPrefix;
      const hash = hashQuery(args);
      const cacheKey = `${prefix}:${hash}`;

      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.debug(`[Cache Hit] ${cacheKey}`);
        return cached;
      }

      logger.debug(`[Cache Miss] ${cacheKey} - Fetching from DB`);
      const result = await originalMethod.apply(this, args);
      if (result !== undefined && result !== null) {
        await cacheService.set(cacheKey, result);
      }
      return result;
    };

    return descriptor;
  };
}

export function InvalidateCache(patterns: string[] | ((args: any[], result: any) => string[])) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      const cacheService = (this as any).cacheService;
      if (cacheService) {
        const resolvedPatterns = typeof patterns === 'function' ? patterns(args, result) : patterns;
        const normalizedPatterns = resolvedPatterns.map(p => p.endsWith('*') ? p : `${p}:*`);
        await cacheService.delMultiple(normalizedPatterns);
      }
      
      return result;
    };

    return descriptor;
  };
}
