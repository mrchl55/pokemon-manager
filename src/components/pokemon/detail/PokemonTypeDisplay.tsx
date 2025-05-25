'use client';

import * as React from 'react';
import { Typography, Box, Chip } from '@mui/material';

interface PokemonTypeDisplayProps {
  types?: string[] | null;
}

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

export default function PokemonTypeDisplay({ types }: PokemonTypeDisplayProps) {
  if (!types || types.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2, textAlign: {xs: 'center', md: 'left'} }}>
      <Typography variant="h6" sx={{fontWeight: 'bold', mb:1}}>Type</Typography>
      {types.map(type => (
        <Chip 
            key={type} 
            label={type} 
            sx={{ 
                mr: 1, 
                mb: 1, 
                backgroundColor: getPokemonTypeColor(type), 
                color: 'white', 
                textTransform: 'capitalize', 
                borderRadius: '6px' 
            }}
        />
      ))}
    </Box>
  );
} 