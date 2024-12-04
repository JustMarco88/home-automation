import { kv } from '@vercel/kv';

export async function getCacheKey<T>(key: string): Promise<T | null> {
  try {
    return await kv.get(key);
  } catch (error) {
    console.error('Error getting cache key:', error);
    return null;
  }
}

export async function setCacheKey<T>(
  key: string,
  value: T,
  expirationSeconds?: number
): Promise<void> {
  try {
    if (expirationSeconds) {
      await kv.set(key, value, { ex: expirationSeconds });
    } else {
      await kv.set(key, value);
    }
  } catch (error) {
    console.error('Error setting cache key:', error);
  }
}

export async function deleteCacheKey(key: string): Promise<void> {
  try {
    await kv.del(key);
  } catch (error) {
    console.error('Error deleting cache key:', error);
  }
} 