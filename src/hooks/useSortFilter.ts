import { useState, useMemo } from 'react';

export interface Game {
  id: string;
  name: string;
  cover: string;
  estimatedHours: number;
  metascore: number;
  stars: number;
  positivePercentage: number;
  totalPositiveComments?: number; // Added field for positive comments count
  // Nuevos campos
  hoursToComplete?: number;
  hasPlatinum?: boolean;
}

type SortField = 'estimatedHours' | 'metascore' | 'stars' | 'positivePercentage';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  positivePercentageMin: number;
}

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export const useSortFilter = (games: Game[]) => {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: 'desc'
  });
  
  const [filterState, setFilterState] = useState<FilterState>({
    positivePercentageMin: 0
  });

  const sortedAndFilteredGames = useMemo(() => {
    let result = [...games];

    // Apply filters
    result = result.filter(game => 
      game.positivePercentage >= filterState.positivePercentageMin
    );

    // Apply sorting
    if (sortState.field) {
      result.sort((a, b) => {
        const fieldA = a[sortState.field!];
        const fieldB = b[sortState.field!];
        
        if (sortState.direction === 'asc') {
          return fieldA - fieldB;
        } else {
          return fieldB - fieldA;
        }
      });
    }

    return result;
  }, [games, sortState, filterState]);

  const setSortField = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const setPositivePercentageFilter = (min: number) => {
    setFilterState(prev => ({
      ...prev,
      positivePercentageMin: min
    }));
  };

  return {
    sortedAndFilteredGames,
    sortState,
    filterState,
    setSortField,
    setPositivePercentageFilter
  };
};