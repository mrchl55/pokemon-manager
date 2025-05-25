'use client';

import React from 'react';
import {
  Container, Typography, CircularProgress, Box, Alert, Snackbar, Button
} from '@mui/material';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import useDebounce from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';

import PokemonFilterBar from '@/components/pokemon/PokemonFilterBar';
import PokemonGridDisplay from '@/components/pokemon/PokemonGridDisplay';
import DeleteConfirmationDialog from '@/components/pokemon/DeleteConfirmationDialog';
import { PaginatedPokemonResponse } from '@/types/pokemon';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const fetchPokemons = async (
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  filters: Record<string, string | number | boolean>
): Promise<PaginatedPokemonResponse> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy: sortBy,
    sortOrder: sortOrder,
    ...filters,
  });

  for (const key of Object.keys(filters)) {
    if (!filters[key] && filters[key] !== 0) {
      queryParams.delete(key);
    }
  }
  
  const response = await fetch(`/api/pokemon?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch Pokemon');
  }
  return response.json();
};

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [selectedPokemonId, setSelectedPokemonId] = React.useState<number | null>(null);
  const [selectedPokemonName, setSelectedPokemonName] = React.useState<string | undefined>(undefined);

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [sortBy, setSortBy] = React.useState('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  
  const [nameFilter, setNameFilter] = React.useState('');
  const [minHeightFilter, setMinHeightFilter] = React.useState('');
  const [maxHeightFilter, setMaxHeightFilter] = React.useState('');
  const [minWeightFilter, setMinWeightFilter] = React.useState('');
  const [maxWeightFilter, setMaxWeightFilter] = React.useState('');

  const [snackbar, setSnackbar] = React.useState<SnackbarState | null>(null);

  const debouncedNameFilter = useDebounce(nameFilter, 500);
  const debouncedMinHeightFilter = useDebounce(minHeightFilter, 500);
  const debouncedMaxHeightFilter = useDebounce(maxHeightFilter, 500);
  const debouncedMinWeightFilter = useDebounce(minWeightFilter, 500);
  const debouncedMaxWeightFilter = useDebounce(maxWeightFilter, 500);

  const currentFilters = React.useMemo(() => ({
    name: debouncedNameFilter,
    minHeight: debouncedMinHeightFilter,
    maxHeight: debouncedMaxHeightFilter,
    minWeight: debouncedMinWeightFilter,
    maxWeight: debouncedMaxWeightFilter,
  }), [
    debouncedNameFilter, debouncedMinHeightFilter, debouncedMaxHeightFilter, 
    debouncedMinWeightFilter, debouncedMaxWeightFilter
  ]);

  const { data, isLoading, error } = useQuery<PaginatedPokemonResponse, Error>({
    queryKey: ['pokemons', page, limit, sortBy, sortOrder, currentFilters],
    queryFn: () => fetchPokemons(page, limit, sortBy, sortOrder, currentFilters),
  });

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: async (pokemonId: number) => {
      const response = await fetch(`/api/pokemon/${pokemonId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete Pokemon and parse error' }));
        throw new Error(errorData.message || 'Failed to delete Pokemon');
      }
      return pokemonId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pokemons'] });
      setSnackbar({ open: true, message: 'Pokemon deleted successfully!', severity: 'success' });
      setOpenDeleteDialog(false);
      setSelectedPokemonId(null);
      setSelectedPokemonName(undefined);
    },
    onError: (error: Error) => {
      setSnackbar({ open: true, message: error.message || 'Failed to delete Pokemon', severity: 'error' });
    },
  });

  const handleDeleteClick = (id: number, name: string) => {
    setSelectedPokemonId(id);
    setSelectedPokemonName(name);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleteMutation.isPending) return;
    setOpenDeleteDialog(false);
    setSelectedPokemonId(null);
    setSelectedPokemonName(undefined);
  };

  const handleConfirmDelete = () => {
    if (selectedPokemonId) {
      deleteMutation.mutate(selectedPokemonId);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(null);
  };

  return (
    <>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: (session ? 2 : 4) }}>
          <Typography variant="h4" component="h1">
            Search Pokemon
          </Typography>
          {session && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push('/pokemon/add')}
            >
              Add New Pokemon
            </Button>
          )}
        </Box>

        <PokemonFilterBar 
          nameFilter={nameFilter}
          onNameFilterChange={setNameFilter}
          minHeightFilter={minHeightFilter}
          onMinHeightFilterChange={setMinHeightFilter}
          maxHeightFilter={maxHeightFilter}
          onMaxHeightFilterChange={setMaxHeightFilter}
          minWeightFilter={minWeightFilter}
          onMinWeightFilterChange={setMinWeightFilter}
          maxWeightFilter={maxWeightFilter}
          onMaxWeightFilterChange={setMaxWeightFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          limit={limit}
          onLimitChange={handleLimitChange}
        />

        <PokemonGridDisplay 
          isLoading={isLoading}
          error={error}
          data={data}
          session={session}
          page={page}
          onPageChange={handlePageChange}
          onDeleteClick={handleDeleteClick}
        />

       <DeleteConfirmationDialog 
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        isPending={deleteMutation.isPending}
        error={deleteMutation.error}
        pokemonName={selectedPokemonName}
       />
      {snackbar && (
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Container>
    </>
  );
}
