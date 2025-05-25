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
      <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5}} sx={{display: 'flex', alignItems:'stretch'}}>
            <Box sx={{
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              p: 2, 
              backgroundColor: '#F3F4F6',
              borderRadius: '8px', 
              width: '100%' 
            }}>
            {image ? (
                <Image src={image} alt={name} width={280} height={280} style={{ objectFit: 'contain' }} />
            ) : (
              <Box sx={{textAlign: 'center', display:'flex', alignItems:'center', justifyContent:'center', minHeight: 280, color: '#6B7280'}}>
                No image available.
              </Box>
            )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 7}}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5, textAlign: {xs: 'center', md: 'left'} }}>
              {name} 
              {pokedexId && 
                <Typography component="span" variant="h4" sx={{ color: 'text.secondary', fontWeight: 'bold', ml: 1}}>
                   #{pokedexId.toString().padStart(4, '0')}
                </Typography>
              }
            </Typography>
            
            {description && <Typography variant="body1" sx={{ mb: 2, color:'text.secondary', textAlign: {xs: 'center', md: 'left'} }}>{description}</Typography>}
            {!description && pokeApiDetails !== null && <Typography variant="body1" sx={{ mb: 2, color:'text.secondary', textAlign: {xs: 'center', md: 'left'} }}>No description available.</Typography>}

            <Paper sx={{ p: 2, backgroundColor: '#3B82F6', color: 'white', borderRadius: '8px', mb: 2 }} elevation={0}>
              <Grid container spacing={2}>
                <Grid size={{xs: 6, sm: 3}}>
                    <Typography variant="subtitle2" sx={{fontWeight:'bold'}}>Height</Typography>
                    <Typography variant="body2">{pokeApiDetails ? `${(height / 10).toFixed(1)}m` : `${height} (local)`}</Typography> 
                </Grid>
                <Grid size={{xs: 6, sm: 3}}>
                    <Typography variant="subtitle2" sx={{fontWeight:'bold'}}>Weight</Typography>
                    <Typography variant="body2">{pokeApiDetails ? `${(weight / 10).toFixed(1)}kg` : `${weight} (local)`}</Typography>
                </Grid>
                {category && (
                    <Grid size={{xs: 6, sm: 3}}>
                        <Typography variant="subtitle2" sx={{fontWeight:'bold'}}>Category</Typography>
                        <Typography variant="body2">{category}</Typography>
                    </Grid>
                )}
                {gender && (
                     <Grid size={{xs: 6, sm: 3}}>
                        <Typography variant="subtitle2" sx={{fontWeight:'bold'}}>Gender</Typography>
                        <Typography variant="body2">{gender}</Typography>
                    </Grid>
                )}
                {abilities && abilities.length > 0 && (
                  <Grid size={{xs: 12}} sx={{mt: 1}}>
                    <Typography variant="subtitle2" sx={{fontWeight:'bold'}}>Abilities</Typography>
                    <Box component="div">
                      {abilities.map(ability => (
                        <Typography key={ability.name} variant="body2" component="div">
                          {ability.name.charAt(0).toUpperCase() + ability.name.slice(1)}
                          {ability.is_hidden ? <Typography component="span" variant="caption" sx={{ ml: 0.5, fontStyle: 'italic' }}>(Hidden)</Typography> : ''}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            {types && types.length > 0 && (
              <Box sx={{ mb: 2, textAlign: {xs: 'center', md: 'left'} }}>
                <Typography variant="h6" sx={{fontWeight: 'bold', mb:1}}>Type</Typography>
                {types.map(type => (
                  <Chip key={type} label={type} sx={{ mr: 1, mb: 1, backgroundColor: getPokemonTypeColor(type), color: 'white', textTransform: 'capitalize', borderRadius: '6px' }} />
                ))}
              </Box>
            )}
          </Grid>
          
          {stats && stats.length > 0 && (
            <Grid size={{xs:12}} sx={{mt:2}}>
                <Typography variant="h5" gutterBottom sx={{fontWeight: 'bold', textAlign: {xs: 'center', md: 'left'} }}>Stats</Typography>
                <Paper variant="outlined" sx={{p:2, backgroundColor: '#E5E7EB', borderRadius:'8px'}}>
                    <Grid container spacing={{xs: 1, sm: 2}}>
                        {stats.map(stat => (
                            <Grid key={stat.name} size={{xs:6, sm:4, md:2}} sx={{textAlign: 'center'}}>
                                <Typography variant="subtitle1" sx={{fontWeight:'bold'}}>{stat.base_stat}</Typography>
                                <Box sx={{ width: '80%', margin: 'auto', backgroundColor: '#9CA3AF', borderRadius: '4px', overflow: 'hidden', height: 8, mt: 0.5, mb:0.5 }}>
                                    <Box sx={{ width: `${Math.min((stat.base_stat / 180) * 100, 100)}%`, backgroundColor: '#60A5FA', height: '100%' }} />
                                </Box>
                                <Typography variant="caption" sx={{textTransform: 'capitalize', display:'block'}}>{stat.name.replace('-', ' ' )}</Typography>
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