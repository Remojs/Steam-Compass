import { useState, useEffect, useCallback } from 'react';
import { Game } from './useSortFilter';

interface CacheData {
  games: Game[];
  lastUpdated: string;
  userId: string;
}

const CACHE_KEY = 'steamcompass_games_cache';
const CACHE_EXPIRY_HOURS = 24; // Caché válido por 24 horas

export const useGameCache = () => {
  const [cachedGames, setCachedGames] = useState<Game[] | null>(null);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      setCachedGames(null);
      console.log('🧹 Caché limpiado');
    } catch (error) {
      console.error('❌ Error limpiando caché:', error);
    }
  }, []);

  const loadFromCache = useCallback(() => {
    setIsLoadingFromCache(true);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cacheData: CacheData = JSON.parse(cached);
        
        // Verificar si el caché no ha expirado
        const lastUpdated = new Date(cacheData.lastUpdated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < CACHE_EXPIRY_HOURS && cacheData.games.length > 0) {
          console.log(`📦 Cargando ${cacheData.games.length} juegos desde caché (${Math.round(hoursDiff)}h ago)`);
          setCachedGames(cacheData.games);
        } else {
          console.log('🗑️ Caché expirado, limpiando...');
          clearCache();
        }
      }
    } catch (error) {
      console.error('❌ Error leyendo caché:', error);
      clearCache();
    }
    setIsLoadingFromCache(false);
  }, [clearCache]);

  // Cargar datos del caché al inicializar
  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  const saveToCache = useCallback((games: Game[], userId: string) => {
    try {
      const cacheData: CacheData = {
        games,
        lastUpdated: new Date().toISOString(),
        userId
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setCachedGames(games);
      console.log(`💾 Guardados ${games.length} juegos en caché`);
    } catch (error) {
      console.error('❌ Error guardando en caché:', error);
    }
  }, []);

  const isValidCache = useCallback((userId: string): boolean => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;
      
      const cacheData: CacheData = JSON.parse(cached);
      return cacheData.userId === userId && cacheData.games.length > 0;
    } catch {
      return false;
    }
  }, []);

  const getCacheInfo = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const cacheData: CacheData = JSON.parse(cached);
      const lastUpdated = new Date(cacheData.lastUpdated);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      return {
        gameCount: cacheData.games.length,
        lastUpdated: lastUpdated,
        hoursAgo: Math.round(hoursDiff * 10) / 10,
        userId: cacheData.userId
      };
    } catch {
      return null;
    }
  }, []);

  return {
    cachedGames,
    isLoadingFromCache,
    saveToCache,
    clearCache,
    isValidCache,
    getCacheInfo,
    loadFromCache
  };
};
