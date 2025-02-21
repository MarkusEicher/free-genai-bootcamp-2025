import { compress, decompress } from 'lz-string';

interface StorageStats {
  totalSize: number;
  itemCount: number;
  compressionRatio: number;
}

export const cacheCompression = {
  /**
   * Compresses data for storage
   */
  compress: (data: any): string => {
    try {
      const jsonString = JSON.stringify(data);
      return compress(jsonString);
    } catch (error) {
      console.error('Compression failed:', error);
      throw new Error('Failed to compress cache data');
    }
  },

  /**
   * Decompresses stored data
   */
  decompress: (compressed: string): any => {
    try {
      const jsonString = decompress(compressed);
      if (!jsonString) throw new Error('Decompression failed');
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error('Failed to decompress cache data');
    }
  },

  /**
   * Calculates the size of data in bytes
   */
  getSize: (data: any): number => {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch (error) {
      console.error('Size calculation failed:', error);
      return 0;
    }
  },

  /**
   * Gets storage statistics
   */
  getStorageStats: (): StorageStats => {
    let totalSize = 0;
    let itemCount = 0;
    let originalSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('lang_portal_cache_')) {
          const item = localStorage.getItem(key);
          if (item) {
            totalSize += new Blob([item]).size;
            originalSize += cacheCompression.getSize(cacheCompression.decompress(item));
            itemCount++;
          }
        }
      }

      return {
        totalSize,
        itemCount,
        compressionRatio: originalSize > 0 ? totalSize / originalSize : 1
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalSize: 0,
        itemCount: 0,
        compressionRatio: 1
      };
    }
  },

  /**
   * Checks if compression should be applied based on data size
   */
  shouldCompress: (data: any): boolean => {
    const size = cacheCompression.getSize(data);
    // Only compress if data is larger than 1KB
    return size > 1024;
  }
}; 