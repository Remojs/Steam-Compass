import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSortFilter, Game } from '../../hooks/useSortFilter';
import { fetchGames } from '../../services/api';
import { GameTable } from './GameTable';
import { Filters } from './Filters';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import compassLogo from '../../assets/compass-logo.png';

export const Dashboard = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();
  
  const {
    sortedAndFilteredGames,
    sortState,
    filterState,
    setSortField,
    setPositivePercentageFilter
  } = useSortFilter(games);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const gameData = await fetchGames();
        setGames(gameData);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGames();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-bg-overlay">
      {/* Header */}
      <header className="bg-gradient-card/80 border-b border-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center p-2">
                <img src={compassLogo} alt="Steam Compass" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent">
                  Steam Compass
                </h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenido, {user?.username}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={logout}
              className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-3 text-foreground">Tu Biblioteca de Juegos</h2>
          <p className="text-muted-foreground">
            {!isLoading && (
              <>
                Mostrando {sortedAndFilteredGames.length} de {games.length} juegos
              </>
            )}
          </p>
        </div>

        <Filters
          sortState={sortState}
          filterState={filterState}
          onSortField={setSortField}
          onPositivePercentageFilter={setPositivePercentageFilter}
        />

        <GameTable 
          games={sortedAndFilteredGames} 
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};