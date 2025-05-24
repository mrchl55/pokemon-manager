'use client';

import * as React from 'react';
import { Container, Typography, TextField, Button, Paper, Box, CircularProgress, Alert } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface NewPokemonData {
  name: string;
  height: number | string;
  weight: number | string;
  image?: string;
}

const createPokemon = async (pokemonData: NewPokemonData) => {
  const response = await fetch('/api/pokemon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        ...pokemonData,
        height: Number(pokemonData.height),
        weight: Number(pokemonData.weight),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create Pokemon');
  }
  return response.json();
};

export default function AddPokemonPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();

  const [name, setName] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [image, setImage] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createPokemon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pokemons'] });
      router.push('/pokemon/search');
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  React.useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/');
    }
  }, [session, status, router]);


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!name || !height || !weight) {
      setFormError('Name, Height, and Weight are required.');
      return;
    }
    if (isNaN(Number(height)) || isNaN(Number(weight))) {
        setFormError('Height and Weight must be numbers.');
        return;
    }

    mutation.mutate({ name, height, weight, image });
  };

  if (status === 'loading' || !session) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Pokemon
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Name"
            name="name"
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!formError && !name}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="height"
            label="Height"
            name="height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            error={!!formError && (!height || isNaN(Number(height)))}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="weight"
            label="Weight"
            name="weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            error={!!formError && (!weight || isNaN(Number(weight)))}
          />
          <TextField
            margin="normal"
            fullWidth
            id="image"
            label="Image URL (Official Artwork)"
            name="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          
          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {mutation.error?.message || 'An unexpected error occurred.'}
            </Alert>
          )}
          {formError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <CircularProgress size={24} /> : 'Add Pokemon'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 