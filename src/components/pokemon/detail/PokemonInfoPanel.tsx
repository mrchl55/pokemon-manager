'use client';

import * as React from 'react';
import {
  Paper, Typography, Grid, Box
} from '@mui/material';

interface PokeApiAbility {
    name: string;
    is_hidden: boolean;
}

interface PokemonInfoPanelProps {
  height: number;
  weight: number;
  category?: string | null;
  gender?: string | null;
  abilities?: PokeApiAbility[] | null;
  hasApiDetails: boolean;
}

export default function PokemonInfoPanel({
  height,
  weight,
  category,
  gender,
  abilities,
  hasApiDetails,
}: PokemonInfoPanelProps) {
  return (
    <Paper sx={{ p: 2, backgroundColor: '#3B82F6', color: 'white', borderRadius: '8px', mb: 2 }} elevation={0}>
      <Grid container spacing={2}>
        <Grid size={{xs: 6, sm: 3}}>
            <Typography variant="subtitle2" sx={{fontWeight:'bold'}}>Height</Typography>
            <Typography variant="body2">{hasApiDetails ? `${(height / 10).toFixed(1)}m` : `${height} (local)`}</Typography> 
        </Grid>
        <Grid size={{xs: 6, sm: 3}}>
            <Typography variant="subtitle2" sx={{fontWeight:'bold'}}>Weight</Typography>
            <Typography variant="body2">{hasApiDetails ? `${(weight / 10).toFixed(1)}kg` : `${weight} (local)`}</Typography>
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
          <Grid size={{xs: 12}} sx={{mt: {xs: 0, sm:1} }}>
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
  );
} 