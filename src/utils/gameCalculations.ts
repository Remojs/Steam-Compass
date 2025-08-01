import { Game } from '../hooks/useSortFilter';

/**
 * Calcular rating de estrellas basado en Metascore y % de opiniones positivas
 */
export const calculateStarRating = (game: Game): number => {
  let totalScore = 0;
  let factorCount = 0;

  // Factor 1: Metacritic Score (peso: 60%)
  let metacriticScore = game.metascore;
  if (!metacriticScore || metacriticScore === 0) {
    // Estimar basado en opiniones positivas si no hay metascore
    if (game.positivePercentage > 0) {
      metacriticScore = Math.round(game.positivePercentage * 0.8 + 20);
    } else {
      metacriticScore = 70; // Neutral por defecto
    }
  }
  
  if (metacriticScore > 0) {
    const starScore = Math.min(metacriticScore / 20, 5); // Convertir 0-100 a 0-5
    totalScore += starScore * 0.6;
    factorCount += 0.6;
  }

  // Factor 2: Opiniones positivas (peso: 40%)
  if (game.positivePercentage > 0) {
    const reviewScore = (game.positivePercentage / 20); // Convertir 0-100 a 0-5
    totalScore += reviewScore * 0.4;
    factorCount += 0.4;
  }

  // Si no hay ningún factor, retornar valor base
  if (factorCount === 0) {
    return 3; // Rating base si no hay datos
  }

  // Normalizar el score
  const finalScore = totalScore / factorCount;
  
  // Redondear a 0.5 (medias estrellas)
  return Math.max(0.5, Math.round(finalScore * 2) / 2);
};

/**
 * Verificar si las opiniones positivas se están mostrando correctamente
 */
export const calculatePositivePercentage = (positiveReviews: number, negativeReviews: number): number => {
  if (positiveReviews <= 0 && negativeReviews <= 0) {
    return 0;
  }
  
  const total = positiveReviews + negativeReviews;
  return Math.round((positiveReviews / total) * 100);
};
