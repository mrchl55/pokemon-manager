'use client';

import * as React from 'react';
import { Container, Typography, TextField, Button, Paper, Box, CircularProgress, Alert } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface PokemonData {
  id: number;
  name: string;
  height: number | string; 
  weight: number | string; 
  image?: string | null;
  userId?: string | null; 
}

const fetchPokemonById = async (id: number): Promise<PokemonData> => {
  const response = await fetch(`/api/pokemon/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Pokemon not found or error fetching data.' }));
    throw new Error(errorData.message || 'Failed to fetch Pokemon data');
  }
  return response.json();
};

const updatePokemon = async ({ id, pokemonData }: { id: number, pokemonData: Partial<Omit<PokemonData, 'id'>> }) => {
  const response = await fetch(`/api/pokemon/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        ...pokemonData,
        height: pokemonData.height !== undefined ? Number(pokemonData.height) : undefined,
        weight: pokemonData.weight !== undefined ? Number(pokemonData.weight) : undefined,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update Pokemon and parse error.'}));
    throw new Error(errorData.message || 'Failed to update Pokemon');
  }
  return response.json();
};

export default function EditPokemonPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();

  const pokemonId = Number(params.id);

  const [name, setName] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [image, setImage] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null); 

  const { data: pokemon, isLoading: isLoadingPokemon, error: fetchError } = useQuery<PokemonData, Error, PokemonData> ({
    queryKey: ['pokemon', pokemonId],
    queryFn: () => fetchPokemonById(pokemonId),
    enabled: !!pokemonId && !isNaN(pokemonId) && sessionStatus !== 'loading', 
  });

  React.useEffect(() => {
    if (pokemon && session?.user?.id) {
      if (pokemon.userId === null) {
        setFormError('This Pokemon was seeded and cannot be edited.');
        setIsAuthorized(false);
      } else if (pokemon.userId !== session.user.id) {
        setFormError('You are not authorized to edit this Pokemon.');
        setIsAuthorized(false);
         router.replace('/pokemon/search');
      } else {
        setName(pokemon.name);
        setHeight(pokemon.height.toString());
        setWeight(pokemon.weight.toString());
        setImage(pokemon.image || '');
        setIsAuthorized(true);
      }
    } else if (!isLoadingPokemon && pokemon === null && sessionStatus === 'authenticated') {
        setFormError('Pokemon not found.');
        setIsAuthorized(false);
    }
  }, [pokemon, session, sessionStatus, isLoadingPokemon, router]);

  const mutation = useMutation<PokemonData, Error, Partial<Omit<PokemonData, 'id' | 'userId'>>>({ // Exclude userId from mutation data
    mutationFn: (updatedData: Partial<Omit<PokemonData, 'id' | 'userId'>>) => updatePokemon({ id: pokemonId, pokemonData: updatedData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pokemons'] });
      queryClient.invalidateQueries({ queryKey: ['pokemon', pokemonId] });
      router.push('/pokemon/search');
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  React.useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!session) {
      router.replace('/');
    }
  }, [session, sessionStatus, router]);

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
    
    if (!isAuthorized) {
      setFormError("Cannot submit: Not authorized or data error.");
      return;
    }

    const updatedData: Partial<Omit<PokemonData, 'id' | 'userId'>> = {};
    if (!pokemon) {
        setFormError("Original Pokemon data not loaded. Please refresh.");
        return;
    }

    if (name !== pokemon.name) updatedData.name = name;
    if (Number(height) !== pokemon.height) updatedData.height = Number(height);
    if (Number(weight) !== pokemon.weight) updatedData.weight = Number(weight);
    if (image !== (pokemon.image || '')) updatedData.image = image === '' ? null : image;

    if (Object.keys(updatedData).length === 0) {
        setFormError("No changes detected to update.");
        return;
    }

    mutation.mutate(updatedData);
  };

  if (sessionStatus === 'loading' || isLoadingPokemon || isAuthorized === null) { // Show loader while checking authorization
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!session) { 
    return <Container><Alert severity="warning" sx={{mt: 2}}>Redirecting to login...</Alert></Container>;
  }

  if (!isAuthorized || fetchError) {
    return (
      <Container sx={{mt: 4}}>
        <Alert severity="error">
          {formError || fetchError?.message || 'Could not load or edit Pokemon. You might not have permission or the Pokemon does not exist.'}
        </Alert>
        <Button onClick={() => router.push('/pokemon/search')} sx={{mt:2}}>Back to Search</Button>
      </Container>
    );
  }

  // Render form only if authorized
  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Pokemon: {pokemon?.name || ''}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField margin="normal" required fullWidth id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} error={!!formError && !name} />
          <TextField margin="normal" required fullWidth id="height" label="Height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} error={!!formError && (!height || isNaN(Number(height)))} />
          <TextField margin="normal" required fullWidth id="weight" label="Weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} error={!!formError && (!weight || isNaN(Number(weight)))} />
          <TextField margin="normal" fullWidth id="image" label="Image URL" value={image} onChange={(e) => setImage(e.target.value)} />
          
          {(mutation.isError || (formError && !isAuthorized)) && ( 
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError || mutation.error?.message || 'An unexpected error occurred.'}
            </Alert>
          )}

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={mutation.isPending || isLoadingPokemon || !isAuthorized}>
            {mutation.isPending ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 