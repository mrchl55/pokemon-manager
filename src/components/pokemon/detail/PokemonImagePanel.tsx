'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import Image from 'next/image';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

interface PokemonImagePanelProps {
  imageUrl?: string | null;
  pokemonName: string;
}

export default function PokemonImagePanel({ imageUrl, pokemonName }: PokemonImagePanelProps) {
  return (
    <Box sx={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      p: 2, 
      backgroundColor: '#F3F4F6', 
      borderRadius: '8px', 
      width: '100%', 
      minHeight: { xs: 200, sm: 280 } 
    }}>
      {imageUrl ? (
        <Image src={imageUrl} alt={pokemonName} width={280} height={280} style={{ objectFit: 'contain' }} />
      ) : (
        <Box sx={{textAlign: 'center', display:'flex', alignItems:'center', justifyContent:'center', width: '100%', height: '100%', minHeight: 280, color: '#6B7280'}}>
          <QuestionMarkIcon sx={{ fontSize: { xs: 150, sm: 200 } }} />
        </Box>
      )}
    </Box>
  );
} 