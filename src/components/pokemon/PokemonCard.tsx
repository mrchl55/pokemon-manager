'use client';

import * as React from 'react';
import {
  Grid, Card, CardContent, CardMedia, Typography, Box, Button, CardActions
} from '@mui/material';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';

interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  image?: string | null;
  userId?: string | null;
}

interface PokemonCardProps {
  pokemon: Pokemon;
  session: Session | null;
  onDeleteClick: (id: number, name: string) => void;
}

export default function PokemonCard({ pokemon, session, onDeleteClick }: PokemonCardProps) {
  const router = useRouter();

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card>
        {pokemon.image ? (
          <CardMedia
            component="img"
            height="140"
            image={pokemon.image}
            alt={pokemon.name}
            sx={{ objectFit: 'contain', pt: 1}} 
          />
        ) : (
            <Box sx={{ height: 140, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'grey.100'}}>
            <QuestionMarkIcon sx={{ fontSize: 80, color: 'grey.400' }} />
            </Box>
        )}
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" sx={{cursor: 'pointer'}} onClick={() => router.push(`/pokemon/${pokemon.id}`)}>
            {pokemon.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Height: {pokemon.height}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Weight: {pokemon.weight}
          </Typography>
        </CardContent>
        {session?.user?.id === pokemon.userId && pokemon.userId !== null && (
          <CardActions>
            <Button 
              size="small" 
              onClick={() => router.push(`/pokemon/edit/${pokemon.id}`)}
            >
              Edit
            </Button>
            <Button 
              size="small" 
              color="error"
              onClick={() => onDeleteClick(pokemon.id, pokemon.name)}
            >
              Delete
            </Button>
          </CardActions>
        )}
      </Card>
    </Grid>
  );
} 