import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface FiltersProps {
  sortState: {
    field: string | null;
    direction: 'asc' | 'desc';
  };
  filterState: {
    positivePercentageMin: number;
  };
  onSortField: (field: 'estimatedHours' | 'metascore' | 'stars' | 'positivePercentage') => void;
  onPositivePercentageFilter: (min: number) => void;
}

export const Filters = ({ 
  sortState, 
  filterState, 
  onSortField, 
  onPositivePercentageFilter 
}: FiltersProps) => {
  const getSortIcon = (field: string) => {
    if (sortState.field !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortState.direction === 'desc' ? 
      <ArrowDown className="w-4 h-4" /> : 
      <ArrowUp className="w-4 h-4" />;
  };

  return (
    <div className="bg-gradient-card p-6 rounded-xl border border-border/50 mb-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Filtros y Ordenamiento</h3>
      
      <div className="flex flex-wrap gap-4 items-end">
        {/* Sort buttons */}
        <div className="space-y-2">
          <Label className="text-accent">Ordenar por:</Label>
          <div className="flex gap-2">
            <Button
              variant={sortState.field === 'estimatedHours' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onSortField('estimatedHours')}
              className="gap-2"
            >
              Horas {getSortIcon('estimatedHours')}
            </Button>
            
            <Button
              variant={sortState.field === 'metascore' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onSortField('metascore')}
              className="gap-2"
            >
              Metascore {getSortIcon('metascore')}
            </Button>
            
            <Button
              variant={sortState.field === 'stars' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onSortField('stars')}
              className="gap-2"
            >
              Estrellas {getSortIcon('stars')}
            </Button>
            
            <Button
              variant={sortState.field === 'positivePercentage' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => onSortField('positivePercentage')}
              className="gap-2"
            >
              % Positivo {getSortIcon('positivePercentage')}
            </Button>
          </div>
        </div>
        
        {/* Positive percentage filter */}
        <div className="space-y-2">
          <Label htmlFor="positiveFilter">% Opiniones positivas mínimo:</Label>
          <Input
            id="positiveFilter"
            type="number"
            min="0"
            max="100"
            value={filterState.positivePercentageMin}
            onChange={(e) => onPositivePercentageFilter(Number(e.target.value))}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};