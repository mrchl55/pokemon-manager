'use client';

import * as React from 'react';
import {
  Container, Typography, Grid, Paper, Box, CircularProgress, Alert, Pagination, Button, AppBar, Toolbar
} from '@mui/material';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import useDebounce from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import PokemonFilterBar from '@/components/pokemon/PokemonFilterBar';
import PokemonGridDisplay from '@/components/pokemon/PokemonGridDisplay';
import DeleteConfirmationDialog from '@/components/pokemon/DeleteConfirmationDialog';

interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  image?: string | null;
  userId?: string | null;
}

interface PaginatedPokemonResponse {
  data: Pokemon[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

const fetchPokemons = async (
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  filters: any
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
  const loadingAuth = status === 'loading';

  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [selectedPokemonId, setSelectedPokemonId] = React.useState<number | null>(null);
  const [selectedPokemonName, setSelectedPokemonName] = React.useState<string | undefined>(undefined);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [sortBy, setSortBy] = React.useState('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  
  const [nameFilter, setNameFilter] = React.useState('');
  const [minHeightFilter, setMinHeightFilter] = React.useState('');
  const [maxHeightFilter, setMaxHeightFilter] = React.useState('');
  const [minWeightFilter, setMinWeightFilter] = React.useState('');
  const [maxWeightFilter, setMaxWeightFilter] = React.useState('');

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
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/pokemon/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        if (response.status === 204) return; 
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete Pokemon and parse error response.' }));
        throw new Error(errorData.message || `Failed to delete Pokemon (status: ${response.status})`);
      }
      if (response.status === 204) return; 
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pokemons'] });
      setOpenDeleteDialog(false);
      setSelectedPokemonId(null);
      setSelectedPokemonName(undefined);
      setDeleteError(null);
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      setDeleteError(error.message || "Could not delete the Pokemon.");
    },
  });

  const handleDeleteClick = (id: number, name: string) => {
    setSelectedPokemonId(id);
    setSelectedPokemonName(name);
    setDeleteError(null);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleteMutation.isPending) return;
    setOpenDeleteDialog(false);
    setSelectedPokemonId(null);
    setSelectedPokemonName(undefined);
    setDeleteError(null);
  };

  const handleConfirmDelete = () => {
    if (selectedPokemonId) {
      deleteMutation.mutate(selectedPokemonId);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pokemon Manager
          </Typography>
          {loadingAuth ? (
            <CircularProgress color="inherit" size={24} />
          ) : session?.user ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 2 }}>
                {session.user.name || session.user.email}
              </Typography>
              <Button color="inherit" onClick={() => signOut()}>
                Sign Out
              </Button>
            </Box>
          ) : (
            <Box>
              <Button 
                color="inherit" 
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </Button>
              <Button 
                color="inherit" 
                onClick={() => router.push('/auth/register')}
                sx={{ ml: 1 }}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
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
        error={deleteError}
        pokemonName={selectedPokemonName}
       />
    </Container>
    </>
  );
}
