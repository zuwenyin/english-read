/**
 * 简单内存缓存（Map 实现）
 *
 * 用于缓存词书列表、文章列表等不频繁变动的数据。
 * 服务启动时加载，通过 /api/cache/clear 或服务重启失效。
 */

const cache = new Map<string, unknown>();

/** 获取缓存值 */
export function cacheGet<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined;
}

/** 设置缓存值 */
export function cacheSet<T>(key: string, value: T): void {
  cache.set(key, value);
}

/** 清除所有缓存 */
export function cacheClear(): void {
  cache.clear();
}
