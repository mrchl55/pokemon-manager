'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Container, Typography, CircularProgress, Alert, Paper, Grid, Box, Chip, Button, IconButton } from '@mui/material';
import Image from 'next/image';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

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

interface PokeApiDetailsType {
  pokedexId?: number;
  description?: string;
  category?: string;
  types?: string[];
  abilities?: PokeApiAbility[];
  stats?: PokeApiStat[];
  gender?: string;
}

interface CombinedPokemonDetails extends LocalPokemonData {
  pokeApiDetails: PokeApiDetailsType | null;
}

interface NavPokemon {
  id: number;
  name: string;
}

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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
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
        <Button onClick={() => router.push('/pokemon/search')} sx={{ mt: 2 }}>
          Back to Search
        </Button>
      </Container>
    );
  }

  const { name, height, weight, image, pokeApiDetails } = pokemonDetails;
  const { pokedexId, description, category, types, abilities, stats, gender } = pokeApiDetails || {};

  return (
    <Container sx={{ mt: 2, mb: 4 }}>
      {/* Navigation Bar */}
      <Paper 
        elevation={2} 
        sx={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 1, 
          mb: 3, 
          backgroundColor: 'grey.200', 
          borderRadius: '8px' 
        }}
      >
        {prevPokemon ? (
          <Link href={`/pokemon/${prevPokemon.id}`} passHref legacyBehavior>
            <Button 
              component="a" 
              startIcon={<ArrowBackIosNewIcon fontSize="small" />} 
              sx={{textTransform: 'none', color: 'text.primary'}}
            >
              <Box sx={{display: 'flex', flexDirection:'column', alignItems:'start'}}>
                <Typography variant="caption" sx={{color: 'text.secondary'}}>#{String(prevPokemon.id).padStart(4, '0')}</Typography>
                <Typography variant="body2" sx={{fontWeight:'medium'}}>{prevPokemon.name}</Typography>
              </Box>
            </Button>
          </Link>
        ) : <Box sx={{width: 'fit-content', visibility: 'hidden'}}><Button startIcon={<ArrowBackIosNewIcon />}>Placeholder</Button></Box> }

        {nextPokemon ? (
          <Link href={`/pokemon/${nextPokemon.id}`} passHref legacyBehavior>
            <Button 
              component="a" 
              endIcon={<ArrowForwardIosIcon fontSize="small"/>} 
              sx={{textTransform: 'none', color: 'text.primary'}}
            >
              <Box sx={{display: 'flex', flexDirection:'column', alignItems:'end'}}>
                <Typography variant="caption" sx={{color: 'text.secondary'}}>#{String(nextPokemon.id).padStart(4, '0')}</Typography>
                <Typography variant="body2" sx={{fontWeight:'medium'}}>{nextPokemon.name}</Typography>
              </Box>
            </Button>
          </Link>
        ) : <Box sx={{width: 'fit-content', visibility: 'hidden'}}><Button endIcon={<ArrowForwardIosIcon />}>Placeholder</Button></Box>}
      </Paper>

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
                <QuestionMarkIcon sx={{ fontSize: 200 }} />
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
            <Grid size={{xs:12, md: 5}} sx={{mt:2}}>
                <Typography variant="h5" gutterBottom sx={{fontWeight: 'bold', textAlign: {xs: 'center', md: 'left'} }}>Stats</Typography>
                <Paper variant="outlined" sx={{p:2, backgroundColor: '#E5E7EB', borderRadius:'8px' }}>
                    <Grid container spacing={{xs: 1, sm: 1.5, md: 2}} justifyContent="space-around">
                        {stats.map(stat => {
                            const MAX_STAT_VALUE = 200;
                            const NUM_SEGMENTS = 10;
                            const segmentHeight = 10;
                            const totalBarHeight = NUM_SEGMENTS * (segmentHeight + 1);
                            const filledSegments = Math.round((stat.base_stat / MAX_STAT_VALUE) * NUM_SEGMENTS);

                            return (
                                <Grid key={stat.name} size={{xs: "auto"}} sx={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                    <Box sx={{
                                        height: `${totalBarHeight}px`,
                                        width: '30px',
                                        display: 'flex',
                                        flexDirection: 'column-reverse',
                                        mb: 0.5
                                    }}>
                                        {[...Array(NUM_SEGMENTS)].map((_, index) => (
                                            <Box
                                                key={index}
                                                sx={{
                                                    height: `${segmentHeight}px`,
                                                    width: '100%',
                                                    backgroundColor: index < filledSegments ? '#60A5FA' : '#D1D5DB',
                                                    borderTop: index > 0 ? '1px solid #9CA3AF' : 'none',
                                                    '&:first-of-type': {
                                                        borderTop: '1px solid #9CA3AF',
                                                    },
                                                    '&:last-of-type': {
                                                         borderBottom: '1px solid #9CA3AF'
                                                    }
                                                }}
                                            />
                                        ))}
                                    </Box>
                                    <Typography variant="caption" sx={{textTransform: 'capitalize', display:'block'}}>{stat.name.replace('-', ' ' )}</Typography>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Paper>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Container>
  );
} 