import { Game } from '../hooks/useSortFilter';

/**
 * Calcular rating de estrellas basado en múltiples factores (con estimaciones inteligentes)
 */
export const calculateStarRating = (game: Game): number => {
  let totalScore = 0;
  let factorCount = 0;

  // Factor 1: Metacritic Score (peso: 40%) - con estimación si no existe
  let metacriticScore = game.metascore;
  if (!metacriticScore || metacriticScore === 0) {
    // Estimar basado en otros factores
    if (game.positivePercentage > 0) {
      metacriticScore = Math.round(game.positivePercentage * 0.8 + 20);
    } else if (game.estimatedHours > 30) {
      metacriticScore = 75; // Si jugó mucho, probablemente le gustó
    } else {
      metacriticScore = 70; // Neutral
    }
  }
  
  if (metacriticScore > 0) {
    const starScore = Math.min(metacriticScore / 20, 5); // Convertir 0-100 a 0-5
    totalScore += starScore * 0.4;
    factorCount += 0.4;
  }

  // Factor 2: Opiniones positivas (peso: 30%)
  if (game.positivePercentage > 0) {
    const reviewScore = (game.positivePercentage / 20); // Convertir 0-100 a 0-5
    totalScore += reviewScore * 0.3;
    factorCount += 0.3;
  }

  // Factor 3: Horas jugadas - más horas = mayor compromiso (peso: 20%)
  if (game.estimatedHours > 0) {
    let hoursScore = 0;
    if (game.estimatedHours >= 100) hoursScore = 5;
    else if (game.estimatedHours >= 50) hoursScore = 4.5;
    else if (game.estimatedHours >= 20) hoursScore = 4;
    else if (game.estimatedHours >= 10) hoursScore = 3.5;
    else if (game.estimatedHours >= 5) hoursScore = 3;
    else if (game.estimatedHours >= 1) hoursScore = 2.5;
    else hoursScore = 2;
    
    totalScore += hoursScore * 0.2;
    factorCount += 0.2;
  }

  // Factor 4: Bonus por trofeo platino (peso: 10%)
  if (game.hasPlatinum) {
    totalScore += 4.5 * 0.1; // Bonus alto por platino
    factorCount += 0.1;
  }

  // Siempre tenemos al menos algún factor (metacritic estimado o horas)
  if (factorCount === 0) {
    return 3; // Rating base si no hay absolutamente nada
  }

  // Normalizar el score
  const finalScore = totalScore / factorCount;
  
  // Redondear a 0.5 (medias estrellas)
  return Math.max(0.5, Math.round(finalScore * 2) / 2);
};

/**
 * Calcular calidad por hora correcta: Metacritic Score / Horas de juego
 */
export const calculateQualityPerHour = (game: Game): number => {
  let metacriticScore = game.metascore;
  let hoursToComplete = game.hoursToComplete || game.estimatedHours;
  
  // Si no tenemos Metacritic, estimarlo basado en otros factores
  if (!metacriticScore || metacriticScore === 0) {
    if (game.positivePercentage > 0) {
      // Convertir % positivo a escala Metacritic (aproximada)
      metacriticScore = Math.round(game.positivePercentage * 0.8 + 20); // 80% positivo = ~84 Metacritic
    } else if (game.estimatedHours > 20) {
      // Si ha jugado muchas horas, probablemente le gusta
      metacriticScore = 75;
    } else {
      // Fallback conservador
      metacriticScore = 70;
    }
  }
  
  // Si no tenemos horas para completar, estimarlo
  if (!hoursToComplete || hoursToComplete === 0) {
    const gameName = game.name.toLowerCase();
    
    // Estimaciones básicas por tipo de juego
    if (gameName.includes('call of duty') || gameName.includes('battlefield')) {
      hoursToComplete = 8;
    } else if (gameName.includes('rpg') || gameName.includes('witcher') || gameName.includes('elder scrolls')) {
      hoursToComplete = 50;
    } else if (gameName.includes('puzzle') || gameName.includes('indie')) {
      hoursToComplete = 10;
    } else if (game.estimatedHours > 0) {
      // Usar las horas jugadas como referencia, pero ajustado
      hoursToComplete = Math.max(game.estimatedHours * 1.5, 5);
    } else {
      hoursToComplete = 15; // Fallback genérico
    }
  }
  
  // Fórmula: Metacritic Score / Horas de juego
  const qualityPerHour = metacriticScore / hoursToComplete;
  
  // Redondear a 2 decimales
  return Math.round(qualityPerHour * 100) / 100;
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
