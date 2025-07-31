import { Game } from '../../hooks/useSortFilter';
import { GameRow } from './GameRow';

interface GameTableProps {
  games: Game[];
  isLoading: boolean;
}

export const GameTable = ({ games, isLoading }: GameTableProps) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-card rounded-xl border border-border/50 backdrop-blur-sm">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-foreground">Cargando biblioteca de juegos...</p>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-gradient-card rounded-xl border border-border/50 backdrop-blur-sm">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No se encontraron juegos con los filtros actuales.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-card rounded-xl border border-border/50 overflow-hidden backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-primary">
            <tr>
              <th className="p-4 text-left font-semibold text-accent">Portada</th>
              <th className="p-4 text-left font-semibold text-accent">Nombre</th>
              <th className="p-4 text-center font-semibold text-accent">Horas Est.</th>
              <th className="p-4 text-center font-semibold text-accent">Metascore</th>
              <th className="p-4 text-center font-semibold text-accent">Estrellas</th>
              <th className="p-4 text-center font-semibold text-accent">% Positivo</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <GameRow key={game.id} game={game} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};