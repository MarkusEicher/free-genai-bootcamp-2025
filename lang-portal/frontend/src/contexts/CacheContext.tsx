import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface CacheData {
  data: any;
  cacheInfo: {
    hit: boolean;
    timestamp: number;
    expires: number;
  };
}

interface CacheContextType {
  getCacheItem: (key: string) => Promise<CacheData | null>;
  setCacheItem: (key: string, data: any, expires: number) => Promise<void>;
  getCacheStatus: (key: string) => Promise<{ timestamp: number; expires: number } | null>;
  clearCache: () => Promise<void>;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

const STORAGE_PREFIX = 'lang_portal_cache_';
const MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB max size

export const CacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cacheSize, setCacheSize] = useState<number>(0);

  // Initialize cache and check version on mount
  useEffect(() => {
    const CACHE_VERSION = '1.0';
    const CACHE_VERSION_KEY = 'lang_portal_cache_version';
    
    const currentVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (!currentVersion || currentVersion !== CACHE_VERSION) {
      // Clear old cache data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
    }

    // Calculate initial cache size
    let size = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        size += new Blob([localStorage.getItem(key) || '']).size;
      }
    });
    setCacheSize(size);
  }, []);

  const getCacheItem = useCallback(async (key: string): Promise<CacheData | null> => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) return null;

      const { data, timestamp, expires } = JSON.parse(item);
      const now = Date.now();

      if (expires && now > expires) {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        return null;
      }

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

      const serializedData = JSON.stringify(cacheData);
      const dataSize = new Blob([serializedData]).size;

      // Check cache size and clear old items if needed
      if (dataSize + cacheSize > MAX_CACHE_SIZE) {
        const keys = Object.keys(localStorage)
          .filter(k => k.startsWith(STORAGE_PREFIX))
          .sort((a, b) => {
            const aData = JSON.parse(localStorage.getItem(a) || '{}');
            const bData = JSON.parse(localStorage.getItem(b) || '{}');
            return (aData.timestamp || 0) - (bData.timestamp || 0);
          });

        let newSize = cacheSize;
        for (const k of keys) {
          if (newSize + dataSize <= MAX_CACHE_SIZE) break;
          const itemSize = new Blob([localStorage.getItem(k) || '']).size;
          localStorage.removeItem(k);
          newSize -= itemSize;
        }
        setCacheSize(newSize);
      }

      localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedData);
      setCacheSize(prev => prev + dataSize);
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }, [cacheSize]);

  const getCacheStatus = useCallback(async (key: string) => {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) return null;

      const { timestamp, expires } = JSON.parse(item);
      return { timestamp, expires };
    } catch (error) {
      console.error('Failed to get cache status:', error);
      return null;
    }
  }, []);

  const clearCache = useCallback(async () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    setCacheSize(0);
  }, []);

  return (
    <CacheContext.Provider value={{
      getCacheItem,
      setCacheItem,
      getCacheStatus,
      clearCache
    }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}; 