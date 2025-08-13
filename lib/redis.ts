import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return redis;
}

export const CACHE_TTL = {
  LIVE: 30, // 30 seconds for live channels
  VOD: 300, // 5 minutes for movies/series
  EPG: 120, // 2 minutes for EPG data
  USER_INFO: 30, // 30 seconds for user info
} as const;

export function getCacheKey(serverCode: string, action: string, params: any = {}): string {
  const paramsHash = Buffer.from(JSON.stringify(params)).toString('base64');
  return `${serverCode}:${action}:${paramsHash}`;
}