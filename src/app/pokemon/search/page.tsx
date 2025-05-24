'use client';

import * as React from 'react';
import {
  Container, Typography, Grid, Paper, TextField,
  Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, Pagination, Card, CardContent, CardMedia,
  Button,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import useDebounce from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';

interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  image?: string | null;
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

export default function PokemonSearchPage() {
  const { data: session } = useSession();
  const router = useRouter();

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

  return (
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
                  {pokemon.image && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={pokemon.image}
                      alt={pokemon.name}
                      sx={{ objectFit: 'contain', pt: 1}} 
                    />
                  )}
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {pokemon.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Height: {pokemon.height}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Weight: {pokemon.weight}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={data.totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
            <FormControl size="small" sx={{minWidth: 120}}>
                <InputLabel id="page-size-label">Items per page</InputLabel>
                <Select
                    labelId="page-size-label"
                    value={limit}
                    label="Items per page"
                    onChange={handleLimitChange as any}
                >
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                </Select>
            </FormControl>
          </Box>
        </>
      )}
    </Container>
  );
}