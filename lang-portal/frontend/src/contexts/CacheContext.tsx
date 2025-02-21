import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { cacheCompression } from '../utils/cacheCompression';
import { cacheMonitor } from '../utils/cacheMonitoring';

interface CacheInfo {
  hit: boolean;
  timestamp: number;
  expires: number;
}

interface CacheData {
  data: any;
  cacheInfo: CacheInfo;
}

interface CacheContextType {
  getCacheItem: (key: string) => Promise<CacheData | null>;
  setCacheItem: (key: string, data: any, expires: number) => Promise<void>;
  invalidateCache: (pattern?: string) => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheStatus: (key: string) => Promise<CacheInfo | null>;
  getStorageStats: () => Promise<{ usage: number; quota: number }>;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const STORAGE_PREFIX = 'lang_portal_cache_';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB default max size

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cacheSize, setCacheSize] = useState<number>(0);

  // Monitor cache health periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cacheMonitor.logHealth();
    }, 60000); // Log health every minute in development

    return () => clearInterval(interval);
  }, []);

  const getCacheItem = useCallback(async (key: string): Promise<CacheData | null> => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) {
        cacheMonitor.recordMiss();
        return null;
      }

      const { data, timestamp, expires } = cacheCompression.decompress(item);
      const now = Date.now();

      if (expires && now > expires) {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        cacheMonitor.recordMiss();
        return null;
      }

      cacheMonitor.recordHit();
      return {
        data,
        cacheInfo: {
          hit: true,
          timestamp,
          expires
        }
      };
    } catch (error) {
      console.error('Cache read error:', error);
      cacheMonitor.recordError();
      return null;
    }
  }, []);

  const setCacheItem = useCallback(async (key: string, data: any, expires: number): Promise<void> => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expires
      };

      // Check if compression should be applied
      const shouldCompress = cacheCompression.shouldCompress(cacheData);
      const serializedData = shouldCompress
        ? cacheCompression.compress(cacheData)
        : JSON.stringify(cacheData);

      // Check cache size before storing
      const dataSize = new Blob([serializedData]).size;

      if (dataSize + cacheSize > MAX_CACHE_SIZE) {
        await cleanCache();
      }

      localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedData);
      setCacheSize(prev => prev + dataSize);
    } catch (error) {
      console.error('Cache write error:', error);
      cacheMonitor.recordError();
      throw new Error('Failed to store in cache');
    }
  }, [cacheSize]);

  const cleanCache = useCallback(async (): Promise<void> => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    const now = Date.now();
    let newSize = 0;

    // Remove expired items first
    for (const key of keys) {
      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const decompressed = cacheCompression.decompress(item);
        const { expires } = decompressed;

        if (expires && now > expires) {
          localStorage.removeItem(key);
        } else {
          newSize += new Blob([item]).size;
        }
      } catch (error) {
        console.error('Cache cleanup error:', error);
        localStorage.removeItem(key);
      }
    }

    setCacheSize(newSize);
  }, []);

  const invalidateCache = useCallback(async (pattern?: string): Promise<void> => {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(STORAGE_PREFIX) && 
      (!pattern || key.includes(pattern))
    );

    keys.forEach(key => localStorage.removeItem(key));
    await cleanCache();
  }, [cleanCache]);

  const clearCache = useCallback(async (): Promise<void> => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
    setCacheSize(0);
    cacheMonitor.resetMetrics();
  }, []);

  const getCacheStatus = useCallback(async (key: string): Promise<CacheInfo | null> => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) return null;

      const { timestamp, expires } = cacheCompression.decompress(item);
      return {
        hit: true,
        timestamp,
        expires
      };
    } catch (error) {
      console.error('Cache status error:', error);
      return null;
    }
  }, []);

  const getStorageStats = useCallback(async () => {
    const stats = cacheCompression.getStorageStats();
    return {
      usage: stats.totalSize,
      quota: MAX_CACHE_SIZE
    };
  }, []);

  const value = {
    getCacheItem,
    setCacheItem,
    invalidateCache,
    clearCache,
    getCacheStatus,
    getStorageStats
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}; 