'use client';

import * as React from 'react';
import { Typography } from '@mui/material';

interface PokemonDescriptionProps {
  description?: string | null;
  hasApiDetails: boolean; 
}

export default function PokemonDescription({ description, hasApiDetails }: PokemonDescriptionProps) {
  if (description) {
    return <Typography variant="body1" sx={{ mb: 2, color:'text.secondary', textAlign: {xs: 'center', md: 'left'} }}>{description}</Typography>;
  }
  if (hasApiDetails) { 
    return <Typography variant="body1" sx={{ mb: 2, color:'text.secondary', textAlign: {xs: 'center', md: 'left'} }}>No description available.</Typography>;
  }
  return null; 
} 