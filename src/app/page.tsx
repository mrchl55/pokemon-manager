'use client';

import * as React from 'react';
import {
  Container, Typography, Grid, Paper, TextField,
  Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, Pagination, Card, CardContent, CardMedia,
  Button, CardActions,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, AppBar, Toolbar
} from '@mui/material';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSession, signOut } from 'next-auth/react';
import useDebounce from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; 

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
  }), [debouncedNameFilter, debouncedMinHeightFilter, debouncedMaxHeightFilter, debouncedMinWeightFilter, debouncedMaxWeightFilter]);

  const { data, isLoading, error } = useQuery<PaginatedPokemonResponse, Error>({
    queryKey: ['pokemons', page, limit, sortBy, sortOrder, currentFilters],
    queryFn: () => fetchPokemons(page, limit, sortBy, sortOrder, currentFilters),
  });

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleLimitChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setLimit(event.target.value as number);
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
      setDeleteError(null);
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      setDeleteError(error.message || "Could not delete the Pokemon.");
    },
  });

  const handleDeleteClick = (id: number) => {
    setSelectedPokemonId(id);
    setDeleteError(null);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    if (deleteMutation.isPending) return;
    setOpenDeleteDialog(false);
    setSelectedPokemonId(null);
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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Filters & Sorting</Typography>
        <Grid container spacing={2} sx={{mt: 1}}>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
                <TextField fullWidth label="Filter by Name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} variant="outlined" size="small"/>
            </Grid>
            <Grid size={{xs: 6, sm: 3, md: 2}}>
                <TextField fullWidth label="Min Height" type="number" value={minHeightFilter} onChange={(e) => setMinHeightFilter(e.target.value)} variant="outlined" size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{xs: 6, sm: 3, md: 2}}>
                <TextField fullWidth label="Max Height" type="number" value={maxHeightFilter} onChange={(e) => setMaxHeightFilter(e.target.value)} variant="outlined" size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{xs: 6, sm: 3, md: 2}}>
                <TextField fullWidth label="Min Weight" type="number" value={minWeightFilter} onChange={(e) => setMinWeightFilter(e.target.value)} variant="outlined" size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{xs: 6, sm: 3, md: 2}}>
                <TextField fullWidth label="Max Weight" type="number" value={maxWeightFilter} onChange={(e) => setMaxWeightFilter(e.target.value)} variant="outlined" size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
                 <FormControl fullWidth size="small">
                    <InputLabel id="sort-by-label">Sort By</InputLabel>
                    <Select
                        labelId="sort-by-label"
                        value={sortBy}
                        label="Sort By"
                        onChange={(e) => setSortBy(e.target.value as string)}
                    >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="height">Height</MenuItem>
                        <MenuItem value="weight">Weight</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
                <FormControl fullWidth size="small">
                    <InputLabel id="sort-order-label">Order</InputLabel>
                    <Select
                        labelId="sort-order-label"
                        value={sortOrder}
                        label="Order"
                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    >
                        <MenuItem value="asc">Ascending</MenuItem>
                        <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
             <Grid size={{xs: 12, sm: 6, md: 2}}> 
                <FormControl fullWidth size="small">
                    <InputLabel id="limit-label">Items per Page</InputLabel>
                    <Select
                        labelId="limit-label"
                        value={limit}
                        label="Items per Page"
                        onChange={handleLimitChange as any} 
                    >
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
      </Paper>

      {isLoading && <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>Error: {error.message}</Alert>}
      
      {data && (
        <>
          <Grid container spacing={2}>
            {data.data.map((pokemon) => (
              <Grid key={pokemon.id} size={{xs: 12, sm: 6, md: 4, lg: 3}}>
                <Card>
                  {pokemon.image ? (
                    <CardMedia
                      component="img"
                      height="140"
                      image={pokemon.image}
                      alt={pokemon.name}
                      sx={{ objectFit: 'contain', pt: 1}} 
                    />
                  ) : (
                     <Box sx={{ height: 140, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'grey.100'}}>
                        <QuestionMarkIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                     </Box>
                  )}
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div" sx={{cursor: 'pointer'}} onClick={() => router.push(`/pokemon/${pokemon.id}`)}>
                      {pokemon.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Height: {pokemon.height}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Weight: {pokemon.weight}
                    </Typography>
                  </CardContent>
                  {session?.user?.id === pokemon.userId && pokemon.userId !== null && (
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => router.push(`/pokemon/edit/${pokemon.id}`)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(pokemon.id)}
                      >
                        Delete
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
          {data.totalPages > 1 && (
            <Pagination
              count={data.totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
            />
          )}
        </>
      )}
       <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this Pokemon? This action cannot be undone.
            {deleteError && <Alert severity="error" sx={{mt:2}}>{deleteError}</Alert>}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleteMutation.isPending}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
}
