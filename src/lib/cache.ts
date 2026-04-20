const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key: string) => {
  const item = cache[key];
  if (item && Date.now() - item.timestamp < CACHE_DURATION) {
    return item.data;
  }
  return null;
};

export const setCachedData = (key: string, data: any) => {
  cache[key] = { data, timestamp: Date.now() };
};
