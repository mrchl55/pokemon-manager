'use client';

import * as React from 'react';
import Link from 'next/link';
import { Paper, Typography, Box, Button } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

interface NavPokemonItem {
  id: number;
  name: string;
}

interface PokemonDetailHeaderProps {
  pokemonName: string;
  pokedexId?: number | null;
  prevPokemon?: NavPokemonItem | null;
  nextPokemon?: NavPokemonItem | null;
}

export default function PokemonDetailHeader({
  pokemonName,
  pokedexId,
  prevPokemon,
  nextPokemon,
}: PokemonDetailHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Paper 
        elevation={2} 
        sx={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 1, 
          mb: 2, 
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
        ) : <Box sx={{width: 'fit-content', minWidth: 120, visibility: 'hidden'}}><Button startIcon={<ArrowBackIosNewIcon />}>Placeholder</Button></Box> }

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
        ) : <Box sx={{width: 'fit-content', minWidth: 120, visibility: 'hidden'}}><Button endIcon={<ArrowForwardIosIcon />}>Placeholder</Button></Box>}
      </Paper>

      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 0.5, textAlign: {xs: 'center', md: 'left'} }}>
        {pokemonName} 
        {pokedexId && 
          <Typography component="span" variant="h4" sx={{ color: 'text.secondary', fontWeight: 'bold', ml: 1}}>
              #{pokedexId.toString().padStart(4, '0')}
          </Typography>
        }
      </Typography>
    </Box>
  );
} 