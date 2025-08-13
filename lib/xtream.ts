import { Xtream } from '@iptv/xtream-api';
import { getRedis, getCacheKey, CACHE_TTL } from './redis';
import Server from '../models/Server';
import connectDB from './mongodb';

interface XtreamConfig {
  serverCode: string;
  username: string;
  password: string;
}

export class XtreamService {
  private redis = getRedis();

  private async getServerConfig(serverCode: string) {
    await connectDB();
    const server = await Server.findOne({ codigo: serverCode.toUpperCase(), ativo: true });
    
    if (!server) {
      throw new Error('Servidor não encontrado ou inativo');
    }

    return {
      baseUrl: server.dns,
      server: server.toObject(),
    };
  }

  private async getCachedData(cacheKey: string) {
    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Erro ao ler do cache:', error);
      return null;
    }
  }

  private async setCachedData(cacheKey: string, data: any, ttl: number) {
    try {
      await this.redis.setex(cacheKey, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao escrever no cache:', error);
    }
  }

  private createXtreamClient(baseUrl: string, username: string, password: string) {
    return new Xtream({
      url: baseUrl,
      username,
      password,
      preferredFormat: 'm3u8',
    });
  }

  async getUserInfo(config: XtreamConfig) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'user_info', { username: config.username });
    
    // Verificar cache primeiro
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    // Buscar na API Xtream
    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const userInfo = await xtream.getProfile();
    
    // Armazenar no cache
    await this.setCachedData(cacheKey, userInfo, CACHE_TTL.USER_INFO);
    
    return userInfo;
  }

  async getMovies(config: XtreamConfig, category?: string) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'movies', { category });
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const movies = await xtream.getMovies({ categoryId: category });
    
    await this.setCachedData(cacheKey, movies, CACHE_TTL.VOD);
    return movies;
  }

  async getMovieCategories(config: XtreamConfig) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'movie_categories');
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const categories = await xtream.getMovieCategories();
    
    await this.setCachedData(cacheKey, categories, CACHE_TTL.VOD);
    return categories;
  }

  async getMovieInfo(config: XtreamConfig, movieId: string) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'movie_info', { movieId });
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const movieInfo = await xtream.getMovie({ movieId });
    
    await this.setCachedData(cacheKey, movieInfo, CACHE_TTL.VOD);
    return movieInfo;
  }

  async getSeries(config: XtreamConfig, category?: string) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'series', { category });
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const series = await xtream.getShows({ categoryId: category });
    
    await this.setCachedData(cacheKey, series, CACHE_TTL.VOD);
    return series;
  }

  async getSeriesCategories(config: XtreamConfig) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'series_categories');
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const categories = await xtream.getShowCategories();
    
    await this.setCachedData(cacheKey, categories, CACHE_TTL.VOD);
    return categories;
  }

  async getSeriesInfo(config: XtreamConfig, seriesId: string) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'series_info', { seriesId });
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const seriesInfo = await xtream.getShow({ showId: seriesId });
    
    await this.setCachedData(cacheKey, seriesInfo, CACHE_TTL.VOD);
    return seriesInfo;
  }

  async getLiveChannels(config: XtreamConfig, category?: string) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'live_channels', { category });
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const channels = await xtream.getChannels({ categoryId: category });
    
    await this.setCachedData(cacheKey, channels, CACHE_TTL.LIVE);
    return channels;
  }

  async getLiveCategories(config: XtreamConfig) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'live_categories');
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const categories = await xtream.getChannelCategories();
    
    await this.setCachedData(cacheKey, categories, CACHE_TTL.LIVE);
    return categories;
  }

  async getChannelEPG(config: XtreamConfig, channelId: string) {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    const cacheKey = getCacheKey(config.serverCode, 'epg', { channelId });
    
    const cached = await this.getCachedData(cacheKey);
    if (cached) return cached;

    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    const epg = await xtream.getFullEPG({ channelId });
    
    await this.setCachedData(cacheKey, epg, CACHE_TTL.EPG);
    return epg;
  }

  async getStreamUrl(config: XtreamConfig, streamId: string, type: 'movie' | 'series' | 'live') {
    const { baseUrl } = await this.getServerConfig(config.serverCode);
    
    const xtream = this.createXtreamClient(baseUrl, config.username, config.password);
    return await xtream.generateStreamUrl({
      type: type === 'movie' ? 'movie' : type === 'series' ? 'episode' : 'channel',
      streamId,
      extension: 'm3u8',
      timeshift: {
        duration: 0,
        start: new Date(),
      },
    });
  }
}

export const xtreamService = new XtreamService();
