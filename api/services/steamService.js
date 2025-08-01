/**
 * Obtener Steam Reviews (positivas/negativas) directamente de la API de Steam
 */
export async function getSteamReviews(appid) {
  try {
    console.log(`📝 [Steam Backend] Obteniendo reviews para appid: ${appid}`);
    
    const url = `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&filter=all&day_range=365&review_type=all&purchase_type=all&page_size=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️ [Steam Backend] HTTP ${response.status} para appid: ${appid}`);
      return { total_positive: 0, total_negative: 0 };
    }
    
    const data = await response.json();
    
    if (!data.query_summary) {
      console.log(`⚠️ [Steam Backend] No query_summary para appid: ${appid}`);
      return { total_positive: 0, total_negative: 0 };
    }
    
    const { total_positive = 0, total_negative = 0 } = data.query_summary;
    
    console.log(`✅ [Steam Backend] Reviews para appid ${appid}: +${total_positive}, -${total_negative}`);
    return { total_positive, total_negative };
    
  } catch (error) {
    console.error(`❌ [Steam Backend] Error para appid ${appid}:`, error.message);
    return { total_positive: 0, total_negative: 0 };
  }
}

/**
 * Obtener información básica del juego desde Steam Store API
 */
export async function getSteamGameDetails(appid) {
  try {
    console.log(`🎮 [Steam Backend] Obteniendo detalles para appid: ${appid}`);
    
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️ [Steam Backend] HTTP ${response.status} para appid: ${appid}`);
      return null;
    }
    
    const data = await response.json();
    const appData = data[appid];
    
    if (!appData || !appData.success) {
      console.log(`⚠️ [Steam Backend] No data success para appid: ${appid}`);
      return null;
    }
    
    const gameData = appData.data;
    console.log(`✅ [Steam Backend] Detalles obtenidos para: ${gameData.name}`);
    
    return {
      name: gameData.name,
      short_description: gameData.short_description,
      genres: gameData.genres?.map(g => g.description) || [],
      categories: gameData.categories?.map(c => c.description) || [],
      release_date: gameData.release_date?.date,
      developers: gameData.developers || [],
      publishers: gameData.publishers || []
    };
    
  } catch (error) {
    console.error(`❌ [Steam Backend] Error para appid ${appid}:`, error.message);
    return null;
  }
}
