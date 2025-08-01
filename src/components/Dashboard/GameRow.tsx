import { Game } from '../../hooks/useSortFilter';
import { Star, Trophy } from 'lucide-react';
import { calculateStarRating, calculateQualityPerHour } from '../../utils/gameCalculations';

interface GameRowProps {
  game: Game;
}

export const GameRow = ({ game }: GameRowProps) => {
  // Calcular valores reales
  const realStarRating = calculateStarRating(game);
  const realQualityPerHour = calculateQualityPerHour(game);
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isHalfStar = rating >= i + 0.5 && rating < starValue;
      const isFullStar = rating >= starValue;
      
      return (
        <Star
          key={i}
          className={`w-4 h-4 ${
            isFullStar 
              ? 'fill-yellow-400 text-yellow-400' 
              : isHalfStar
              ? 'fill-yellow-400/50 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      );
    });
  };

  const getMetascoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    if (score >= 70) return 'text-orange-500';
    return 'text-red-500';
  };

  const getPositivePercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-500';
    if (percentage >= 80) return 'text-primary';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <div className="w-12 h-12 flex-shrink-0">
          <img
            src={game.cover}
            alt={game.name}
            className="w-12 h-12 object-cover rounded-lg border border-border shadow-sm"
            onError={(e) => {
              // Fallback a una imagen por defecto si falla
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
        </div>
      </td>
      
      <td className="p-4">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground">{game.name}</h4>
          {game.hasPlatinum && (
            <div 
              className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-md"
              title="Trofeo Platino disponible"
            >
              <Trophy className="w-3 h-3 text-yellow-900" />
            </div>
          )}
        </div>
      </td>
      
      {/* Horas Jugadas - Basado en Playtime de Steam */}
      <td className="p-4 text-center">
        <span className="text-muted-foreground">
          {game.hoursToComplete > 0 ? `${game.hoursToComplete}h` : '-'}
        </span>
      </td>
      
      {/* Horas para completar 100% */}
      <td className="p-4 text-center">
        <span className="text-muted-foreground">
          {game.estimatedHours > 0 ? `${game.estimatedHours}h` : '-'}
        </span>
      </td>

      <td className="p-4 text-center">
        <span className={`font-bold ${getMetascoreColor(game.metascore)}`}>
          {game.metascore > 0 ? game.metascore : '-'}
        </span>
      </td>
      
      <td className="p-4">
        <div className="flex items-center justify-center gap-1">
          {renderStars(realStarRating)}
        </div>
      </td>
      
      <td className="p-4 text-center">
        <span className={`font-medium ${getPositivePercentageColor(game.positivePercentage)}`}>
          {game.positivePercentage > 0 ? `${game.positivePercentage}%` : '-'}
        </span>
      </td>

      {/* Calidad por hora siempre calculada */}
      <td className="p-4 text-center">
        <span className={`font-medium ${getQualityPerHourColor(realQualityPerHour)}`}>
          {realQualityPerHour.toFixed(2)}
        </span>
      </td>
    </tr>
  );
};

const getQualityPerHourColor = (quality: number) => {
  if (quality >= 2.0) return 'text-emerald-500';    // Excelente (>= 2.0)
  if (quality >= 1.5) return 'text-green-500';      // Muy bueno (1.5-1.99)
  if (quality >= 1.0) return 'text-yellow-500';     // Bueno (1.0-1.49)
  if (quality >= 0.5) return 'text-orange-500';     // Regular (0.5-0.99)
  if (quality > 0) return 'text-red-500';           // Bajo (0.01-0.49)
  return 'text-gray-400';                           // Sin datos (0)
};