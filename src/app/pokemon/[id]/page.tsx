'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography, CircularProgress, Alert, Paper, Grid, Box, Chip, Button } from '@mui/material';
import Image from 'next/image';

interface LocalPokemonData {
  id: number;
  name: string;
  height: number;
  weight: number;
  image?: string | null;
  userId?: string | null;
  createdAt: string; 
  updatedAt: string; 
}

interface PokeApiAbility {
  name: string;
  is_hidden: boolean;
}

interface PokeApiStat {
  name: string;
  base_stat: number;
}

interface PokeApiDetails {
  pokedexId?: number;
  description?: string;
  category?: string;
  types?: string[];
  abilities?: PokeApiAbility[];
  stats?: PokeApiStat[];
  gender?: string;
}

interface CombinedPokemonDetails extends LocalPokemonData {
  pokeApiDetails: PokeApiDetails | null;
}

const fetchPokemonDetails = async (dbId: number): Promise<CombinedPokemonDetails> => {
  const response = await fetch(`/api/pokemon/${dbId}?view=details`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error fetching details and parsing error response.'}));
    throw new Error(errorData.message || `Failed to fetch Pokemon details (status: ${response.status})`);
  }
  return response.json();
};

const getPokemonTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    fire: '#F08030', grass: '#78C850', water: '#6890F0', electric: '#F8D030',
    psychic: '#F85888', ice: '#98D8D8', dragon: '#7038F8', dark: '#705848',
    fairy: '#EE99AC', normal: '#A8A878', fighting: '#C03028', flying: '#A890F0',
    poison: '#A040A0', ground: '#E0C068', rock: '#B8A038', bug: '#A8B820',
    ghost: '#705898', steel: '#B8B8D0', unknown: '#68A090', shadow: '#493963'
  };
  return colors[type.toLowerCase()] || '#A8A878';
};

const getStatColor = (statName: string): string => {
    const colors: { [key: string]: string } = {
      hp: '#FF5959',
      attack: '#F5AC78',
      defense: '#FAE078',
      'special-attack': '#9DB7F5',
      'special-defense': '#A7DB8D',
      speed: '#FA92B2',
    };
    return colors[statName.toLowerCase()] || '#78C850';
  };

export default function PokemonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dbId = Number(params.id);

  const { data: pokemonDetails, isLoading, error, isError } = useQuery<CombinedPokemonDetails, Error>({
    queryKey: ['pokemonDetails', dbId],
    queryFn: () => fetchPokemonDetails(dbId),
    enabled: !isNaN(dbId) && dbId > 0,
  });

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isError || !pokemonDetails) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          {error?.message || 'Could not load Pokemon details. The Pokemon may not exist or an error occurred.'}
        </Alert>
        <Button onClick={() => router.push('/pokemon/search')} sx={{ mt: 2 }}>
          Back to Search
        </Button>
      </Container>
    );
  }

  const { name, height, weight, image, pokeApiDetails } = pokemonDetails;
  const { pokedexId, description, category, types, abilities, stats, gender } = pokeApiDetails || {};

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5}}>
            {image && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, border: '1px solid #eee', borderRadius: 2, minHeight: 300}}>
                <Image src={image} alt={name} width={250} height={250} style={{ objectFit: 'contain' }} />
              </Box>
            )}
            {!image && 
              <Box sx={{textAlign: 'center', p:2, border: '1px solid #eee', borderRadius: 2, minHeight: 300, display:'flex', alignItems:'center', justifyContent:'center'}}>
                No image available.
              </Box>
            }
          </Grid>

          <Grid size={{ xs: 12, md: 7}}>
            <Typography variant="h3" component="h1" gutterBottom>
              {name} {pokedexId ? `#${pokedexId.toString().padStart(4, '0')}` : `(Local ID: ${pokemonDetails.id})`}
            </Typography>
            
            {description && <Typography variant="body1" sx={{ mb: 2 }}>{description}</Typography>}
            {!description && pokeApiDetails !== null && <Typography variant="body1" sx={{ mb: 2 }}>No description available for this Pokemon.</Typography>}

            <Grid container spacing={1} sx={{mb: 2}}>
                <Grid size={{xs:6, sm:4}}>
                    <Typography variant="subtitle2">Height</Typography>
                    <Typography variant="body2">
                        {pokeApiDetails?.types ? `${(pokemonDetails.height / 10).toFixed(1)}m` : `${pokemonDetails.height}cm (local)`}
                    </Typography> 
                </Grid>
                <Grid size={{xs:6, sm:4}}>
                    <Typography variant="subtitle2">Weight</Typography>
                    <Typography variant="body2">
                         {pokeApiDetails?.types ? `${(pokemonDetails.weight / 10).toFixed(1)}kg` : `${pokemonDetails.weight}g (local)`}
                    </Typography>
                </Grid>
                {category && (
                    <Grid size={{xs:6, sm:4}}>
                        <Typography variant="subtitle2">Category</Typography>
                        <Typography variant="body2">{category}</Typography>
                    </Grid>
                )}
                {gender && (
                     <Grid size={{xs:6, sm:4}}>
                        <Typography variant="subtitle2">Gender</Typography>
                        <Typography variant="body2">{gender}</Typography>
                    </Grid>
                )}
            </Grid>
            
            {abilities && abilities.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Abilities</Typography>
                {abilities.map(ability => (
                  <Chip key={ability.name} label={`${ability.name.charAt(0).toUpperCase() + ability.name.slice(1)}${ability.is_hidden ? ' (Hidden)' : ''}`} sx={{ mr: 1, mb: 1, textTransform: 'capitalize' }} />
                ))}
              </Box>
            )}

            {types && types.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6">Type</Typography>
                {types.map(type => (
                  <Chip key={type} label={type} sx={{ mr: 1, mb: 1, backgroundColor: getPokemonTypeColor(type), color: 'white', textTransform: 'capitalize' }} />
                ))}
              </Box>
            )}
          </Grid>
          
          {stats && stats.length > 0 && (
            <Grid size={{xs:12}} sx={{mt:3}}>
                <Typography variant="h5" gutterBottom>Stats</Typography>
                <Paper variant="outlined" sx={{p:2}}>
                    <Grid container spacing={1} alignItems="flex-end">
                        {stats.map(stat => (
                            <Grid key={stat.name} size={{xs:6, sm:4, md:2}} sx={{textAlign: 'center'}}>
                                <Typography variant="h6">{stat.base_stat}</Typography>
                                <Box sx={{ width: '80%', margin: 'auto', backgroundColor: '#e0e0e0', borderRadius: 1, overflow: 'hidden', height: 10, mt: 0.5 }}>
                                    <Box sx={{ width: `${(stat.base_stat / 255) * 100}%`, backgroundColor: getStatColor(stat.name), height: '100%' }} />
                                </Box>
                                <Typography variant="caption" sx={{textTransform: 'capitalize', display:'block', mt:0.5}}>{stat.name.replace('-', ' ' )}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
} 