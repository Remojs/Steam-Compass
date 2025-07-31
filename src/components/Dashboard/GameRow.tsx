import { Game } from '../../hooks/useSortFilter';
import { Star } from 'lucide-react';

interface GameRowProps {
  game: Game;
}

export const GameRow = ({ game }: GameRowProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'fill-primary text-primary' 
            : 'text-muted-foreground'
        }`}
      />
    ));
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
        <img
          src={game.cover}
          alt={game.name}
          className="w-16 h-20 object-cover rounded-md border"
        />
      </td>
      
      <td className="p-4">
        <h4 className="font-medium text-foreground">{game.name}</h4>
      </td>
      
      <td className="p-4 text-center">
        <span className="text-muted-foreground">{game.estimatedHours}h</span>
      </td>
      
      <td className="p-4 text-center">
        <span className={`font-bold ${getMetascoreColor(game.metascore)}`}>
          {game.metascore}
        </span>
      </td>
      
      <td className="p-4">
        <div className="flex items-center justify-center gap-1">
          {renderStars(game.stars)}
        </div>
      </td>
      
      <td className="p-4 text-center">
        <span className={`font-medium ${getPositivePercentageColor(game.positivePercentage)}`}>
          {game.positivePercentage}%
        </span>
      </td>
    </tr>
  );
};