import * as cheerio from 'cheerio';

/**
 * Obtener Metascore y User Score de Metacritic
 */
export async function getMetacriticScores(gameName) {
  try {
    console.log(`🎯 [Metacritic Backend] Obteniendo scores para: ${gameName}`);
    
    // Normalizar el slug del juego
    const slug = normalizeGameSlug(gameName);
    
    if (!slug) {
      console.log(`⚠️ [Metacritic Backend] No se pudo crear slug para: ${gameName}`);
      return { metascore: null, userscore: null };
    }
    
    // Probar múltiples URLs de Metacritic
    const urls = [
      `https://www.metacritic.com/game/${slug}/`,
      `https://www.metacritic.com/game/pc/${slug}/`,
      `https://www.metacritic.com/game/playstation-5/${slug}/`,
      `https://www.metacritic.com/game/xbox-series-x/${slug}/`
    ];
    
    for (const url of urls) {
      console.log(`📡 [Metacritic Backend] Probando URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        console.log(`✅ [Metacritic Backend] Página cargada exitosamente para: ${gameName}`);
        
        // Buscar metascore con múltiples selectores actualizados de 2024/2025
        let metascore = null;
        const metascoreSelectors = [
          // Selectores nuevos de Metacritic 2024+
          'div[data-testid="critic-score"] span',
          'div.c-siteReviewScore span.c-siteReviewScore_background span',
          'div.c-productScoreInfo_scoreNumber',
          'span.c-siteReviewScore_medium',
          'div.metascore_w span',
          // Selectores legacy
          'span[itemprop="ratingValue"]',
          '.metascore_w.rnd_num.large.game.positive',
          '.metascore_w.rnd_num.large.game.mixed', 
          '.metascore_w.rnd_num.large.game.negative',
          '.metascore_w .score',
          '.c-siteReviewScore .c-siteReviewScore_background .c-siteReviewScore_medium'
        ];
        
        for (const selector of metascoreSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const text = element.text().trim();
            console.log(`🔍 [Metacritic Backend] Probando selector "${selector}": "${text}"`);
            const score = parseInt(text, 10);
            if (!isNaN(score) && score >= 0 && score <= 100) {
              metascore = score;
              console.log(`✅ [Metacritic Backend] Metascore encontrado: ${metascore}`);
              break;
            }
          }
        }
        
        // Buscar user score con múltiples selectores actualizados
        let userscore = null;
        const userscoreSelectors = [
          // Selectores nuevos de Metacritic 2024+
          'div[data-testid="user-score"] span',
          'div.c-siteReviewScore_user span.c-siteReviewScore_background span',
          'div.c-productScoreInfo_scoreNumber.u-float-right',
          'span.c-siteReviewScore_user',
          // Selectores legacy
          '.metascore_w.user.large.game.positive .score',
          '.metascore_w.user.large.game.mixed .score',
          '.metascore_w.user.large.game.negative .score',
          '.userscore_wrap .metascore_w.user',
          '.user_score .score',
          '.c-siteReviewScore_user .c-siteReviewScore_background .c-siteReviewScore_medium'
        ];
        
        for (const selector of userscoreSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const text = element.text().trim();
            console.log(`🔍 [Metacritic Backend] Probando user selector "${selector}": "${text}"`);
            const score = parseFloat(text);
            if (!isNaN(score) && score >= 0 && score <= 10) {
              userscore = score;
              console.log(`✅ [Metacritic Backend] User score encontrado: ${userscore}`);
              break;
            }
          }
        }
        
        if (metascore !== null || userscore !== null) {
          console.log(`✅ [Metacritic Backend] Scores para ${gameName}: Metascore=${metascore}, Userscore=${userscore}`);
          return { metascore, userscore };
        }
      } else {
        console.log(`⚠️ [Metacritic Backend] HTTP ${response.status} para URL: ${url}`);
      }
    }
    
    console.log(`❌ [Metacritic Backend] No se encontraron scores en ninguna URL para: ${gameName}`);
    return { metascore: null, userscore: null };
    
  } catch (error) {
    console.error(`❌ [Metacritic Backend] Error para ${gameName}:`, error.message);
    return { metascore: null, userscore: null };
  }
}

/**
 * Normalizar nombre del juego para crear URL slug de Metacritic
 */
function normalizeGameSlug(gameName) {
  if (!gameName || typeof gameName !== 'string') {
    return null;
  }
  
  return gameName
    .toLowerCase()
    .replace(/[®™©]/g, '') // Eliminar símbolos de marca registrada
    .replace(/[^\w\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno solo
    .replace(/^-|-$/g, '') // Eliminar guiones al inicio y final
    .substring(0, 100); // Limitar longitud
}

/**
 * Intentar múltiples variaciones del nombre del juego
 */
export async function searchMetacriticVariations(gameName) {
  const variations = [
    gameName,
    gameName.replace(/[®™©]/g, '').trim(),
    gameName.split(':')[0].trim(),
    gameName.replace(/\([^)]*\)/g, '').trim(),
    gameName.replace(/\d+/g, '').trim(),
    gameName.replace(/\s+/g, '').toLowerCase() // Sin espacios
  ];
  
  console.log(`🔍 [Metacritic Backend] Probando variaciones para: ${gameName}`);
  
  for (const variation of variations) {
    if (variation.length > 2) {
      console.log(`🔍 [Metacritic Backend] Probando variación: "${variation}"`);
      const scores = await getMetacriticScores(variation);
      if (scores.metascore !== null || scores.userscore !== null) {
        console.log(`✅ [Metacritic Backend] Encontrado con variación "${variation}"`);
        return scores;
      }
    }
  }
  
  console.log(`❌ [Metacritic Backend] No se encontraron scores con ninguna variación para: ${gameName}`);
  return { metascore: null, userscore: null };
}
