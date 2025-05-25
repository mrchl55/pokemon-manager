'use client';

import * as React from 'react';
import { Typography, Paper, Grid, Box } from '@mui/material';

interface PokeApiStat {
  name: string;
  base_stat: number;
}

interface PokemonStatsChartProps {
  stats?: PokeApiStat[] | null;
}


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

export default function PokemonStatsChart({ stats }: PokemonStatsChartProps) {
  if (!stats || stats.length === 0) {
    return null;
  }

  return (
    <Box sx={{mt:2}}>
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
                        <Grid key={stat.name} size={{ xs: "auto"}} sx={{textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
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
                                            backgroundColor: index < filledSegments ? getStatColor(stat.name) : '#D1D5DB', 
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
    </Box>
  );
} 