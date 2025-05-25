'use client';

import * as React from 'react';
import {
  Grid, Typography, CircularProgress, Alert, Box, Pagination
} from '@mui/material';
import PokemonCard from './PokemonCard'; 
import { Session } from 'next-auth';

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

interface PokemonGridDisplayProps {
  isLoading: boolean;
  error: Error | null;
  data: PaginatedPokemonResponse | undefined;
  session: Session | null;
  page: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  onDeleteClick: (id: number, name: string) => void;
}

export default function PokemonGridDisplay({
  isLoading,
  error,
  data,
  session,
  page,
  onPageChange,
  onDeleteClick
}: PokemonGridDisplayProps) {
  if (isLoading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>Error: {error.message}</Alert>;
  }

  if (!data || data.data.length === 0) {
    return <Typography sx={{ mt: 4, textAlign: 'center' }}>No Pokemon found matching your criteria.</Typography>;
  }

  return (
    <>
      <Grid container spacing={2}>
        {data.data.map((pokemon) => (
          <PokemonCard 
            key={pokemon.id} 
            pokemon={pokemon} 
            session={session} 
            onDeleteClick={onDeleteClick} 
          />
        ))}
      </Grid>
      {data.totalPages > 1 && (
        <Pagination
          count={data.totalPages}
          page={page}
          onChange={onPageChange}
          color="primary"
          sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}
        />
      )}
    </>
  );
} 