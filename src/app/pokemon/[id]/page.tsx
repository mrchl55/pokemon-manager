'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Container, CircularProgress, Alert, Paper, Grid, Button
} from '@mui/material';

import PokemonDetailHeader from '@/components/pokemon/detail/PokemonDetailHeader';
import PokemonImagePanel from '@/components/pokemon/detail/PokemonImagePanel';
import PokemonDescription from '@/components/pokemon/detail/PokemonDescription';
import PokemonInfoPanel from '@/components/pokemon/detail/PokemonInfoPanel';
import PokemonTypeDisplay from '@/components/pokemon/detail/PokemonTypeDisplay';
import PokemonStatsChart from '@/components/pokemon/detail/PokemonStatsChart';
import { CombinedPokemonDetails, NavPokemon } from '@/types/pokemon';


const fetchPokemonDetails = async (dbId: number): Promise<CombinedPokemonDetails> => {
  const response = await fetch(`/api/pokemon/${dbId}?view=details`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error fetching details and parsing error response.'}));
    throw new Error(errorData.message || `Failed to fetch Pokemon details (status: ${response.status})`);
  }
  return response.json();
};

const fetchNavList = async (): Promise<NavPokemon[]> => {
  const response = await fetch('/api/pokemon/list-for-nav');
  if (!response.ok) {
    throw new Error('Failed to fetch navigation list');
  }
  return response.json();
};

export default function PokemonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dbId = Number(params.id);

  const { 
    data: pokemonDetails, 
    isLoading: isLoadingDetails, 
    error: detailsError, 
    isError: isDetailsError 
  } = useQuery<CombinedPokemonDetails, Error>({
    queryKey: ['pokemonDetails', dbId],
    queryFn: () => fetchPokemonDetails(dbId),
    enabled: !isNaN(dbId) && dbId > 0,
  });

  const { 
    data: navList, 
    isLoading: isLoadingNav, 
  } = useQuery<NavPokemon[], Error>({
    queryKey: ['pokemonNavList'],
    queryFn: fetchNavList,
    staleTime: 5 * 60 * 1000, 
  });

  let prevPokemon: NavPokemon | undefined = undefined;
  let nextPokemon: NavPokemon | undefined = undefined;

  if (pokemonDetails && navList) {
    const currentIndex = navList.findIndex(p => p.id === pokemonDetails.id);
    if (currentIndex !== -1) {
      if (currentIndex > 0) {
        prevPokemon = navList[currentIndex - 1];
      }
      if (currentIndex < navList.length - 1) {
        nextPokemon = navList[currentIndex + 1];
      }
    }
  }

  if (isLoadingDetails || isLoadingNav) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isDetailsError || !pokemonDetails) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {detailsError?.message || 'Could not load Pokemon details. The Pokemon may not exist or an error occurred.'}
        </Alert>
        <Button onClick={() => router.push('/')} sx={{ mt: 2 }}>
          Back to Search
        </Button>
      </Container>
    );
  }

  const { name, height, weight, image, pokeApiDetails } = pokemonDetails;
  const { pokedexId, description, category, types, abilities, stats, gender } = pokeApiDetails || {};

  return (
    <Container sx={{ mt: 2, mb: 4 }}>
      <PokemonDetailHeader 
        pokemonName={name} 
        pokedexId={pokedexId}
        prevPokemon={prevPokemon}
        nextPokemon={nextPokemon}
      />

      <Paper elevation={3} sx={{ p: {xs: 2, md:3}, borderRadius: '12px' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }} sx={{display: 'flex', alignItems:'stretch'}}>
             <PokemonImagePanel imageUrl={image} pokemonName={name} />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <PokemonDescription description={description} hasApiDetails={pokeApiDetails !== null} />
            <PokemonInfoPanel 
                height={height} 
                weight={weight} 
                category={category} 
                gender={gender} 
                abilities={abilities} 
                hasApiDetails={pokeApiDetails !== null}
            />
            <PokemonTypeDisplay types={types} />
          </Grid>
          
          {stats && stats.length > 0 && (
            <Grid size={{ xs: 12, md: 5 }} sx={{mt:{xs: 2, md: 0} }}>
               <PokemonStatsChart stats={stats} />
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
} 