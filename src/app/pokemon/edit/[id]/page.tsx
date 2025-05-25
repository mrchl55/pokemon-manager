'use client';

import * as React from 'react';
import {
  Container, Typography, TextField, Button, Paper, Box, CircularProgress, Alert, FormControlLabel, Checkbox
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image'; 

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

// updatePokemon now sends FormData
const updatePokemonWithUpload = async ({ id, formData }: { id: number, formData: FormData }) => {
  const response = await fetch(`/api/pokemon/${id}`, {
    method: 'PUT',
    body: formData,
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
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string | null>(null);
  const [newImageFile, setNewImageFile] = React.useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  const { data: pokemon, isLoading: isLoadingPokemon, error: fetchError } = useQuery<PokemonData, Error, PokemonData> ({
    queryKey: ['pokemon', pokemonId],
    queryFn: () => fetchPokemonById(pokemonId),
    enabled: !!pokemonId && !isNaN(pokemonId) && sessionStatus !== 'loading',
  });

  React.useEffect(() => {
    if (pokemon) {
        setName(pokemon.name);
        setHeight(pokemon.height.toString());
        setWeight(pokemon.weight.toString());   
        setCurrentImageUrl(pokemon.image || null);
    }
  }, [pokemon]);

  React.useEffect(() => {
    if (sessionStatus === 'loading' || isLoadingPokemon) return;

    if (!session) {
        router.replace('/');
        return;
    }

    if (pokemon) {
      if (pokemon.userId === null) {
        setFormError('This Pokemon was seeded and cannot be edited.');
        setIsAuthorized(false);
      } else if (pokemon.userId !== session.user.id) {
        setFormError('You are not authorized to edit this Pokemon.');
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
    } else if (!isLoadingPokemon && sessionStatus === 'authenticated') {
        setFormError('Pokemon not found.');
        setIsAuthorized(false);
    }
  }, [pokemon, session, sessionStatus, isLoadingPokemon, router]);

  const mutation = useMutation<PokemonData, Error, FormData>({ 
    mutationFn: (formData: FormData) => updatePokemonWithUpload({ id: pokemonId, formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pokemons'] }); 
      queryClient.invalidateQueries({ queryKey: ['pokemon', pokemonId] }); 
      queryClient.invalidateQueries({ queryKey: ['pokemonDetails', pokemonId]}); 
      router.push(`/pokemon/${pokemonId}`); 
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setNewImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveCurrentImage(false); 
    } else {
      setNewImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!isAuthorized) {
      setFormError('Not authorized to perform this action.');
      return;
    }
    if (!name || !height || !weight) {
      setFormError('Name, Height, and Weight are required.');
      return;
    }
    if (isNaN(Number(height)) || isNaN(Number(weight))) {
        setFormError('Height and Weight must be numbers.');
        return;
    }
    if (newImageFile && newImageFile.size > 5 * 1024 * 1024) { // 5MB limit
        setFormError('New image size should not exceed 5MB.');
        return;
    }

    const formData = new FormData();
    if (!pokemon) {
        setFormError("Original Pokemon data not available. Please refresh.");
        return;
    }

    let hasChanges = false;
    if (name !== pokemon.name) { formData.append('name', name); hasChanges = true; }
    if (Number(height) !== pokemon.height) { formData.append('height', height); hasChanges = true; }
    if (Number(weight) !== pokemon.weight) { formData.append('weight', weight); hasChanges = true; }
    
    if (newImageFile) {
      formData.append('image', newImageFile);
      hasChanges = true;
    } else if (removeCurrentImage && currentImageUrl) {
      // Only send removeImage if there was an image and it's being removed without a new one.
      formData.append('removeImage', 'true');
      hasChanges = true;
    }

    if (!hasChanges) {
        setFormError("No changes detected to update.");
        return;
    }

    mutation.mutate(formData);
  };

  if (sessionStatus === 'loading' || isLoadingPokemon || isAuthorized === null) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!session) { 
    return <Container><Alert severity="warning" sx={{mt: 2}}>Redirecting...</Alert></Container>;
  }

  if (!isAuthorized || fetchError) {
    return (
      <Container sx={{mt: 4}}>
        <Alert severity="error">
          {formError || (fetchError instanceof Error ? fetchError.message : 'Could not load or edit Pokemon.')}
        </Alert>
        <Button onClick={() => router.push('/')} sx={{mt:2}}>Back to Search</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Pokemon: {pokemon?.name || ''}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate encType="multipart/form-data">
          {/* Name, Height, Weight TextFields */}
          <TextField margin="normal" required fullWidth id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} error={!!formError && !name} />
          <TextField margin="normal" required fullWidth id="height" label="Height (e.g., 0.7)" type="number" InputProps={{ inputProps: { step: "0.1" } }} value={height} onChange={(e) => setHeight(e.target.value)} error={!!formError && (!height || isNaN(Number(height)))} />
          <TextField margin="normal" required fullWidth id="weight" label="Weight (e.g., 6.9)" type="number" InputProps={{ inputProps: { step: "0.1" } }} value={weight} onChange={(e) => setWeight(e.target.value)} error={!!formError && (!weight || isNaN(Number(weight)))} />
          
          {/* Current Image Preview */}
          {currentImageUrl && !imagePreview && !removeCurrentImage && (
            <Box sx={{ mt: 2, mb:1, textAlign: 'center' }}>
              <Typography variant="subtitle2">Current Image:</Typography>
              <Image src={currentImageUrl} alt="Current Pokemon image" width={150} height={150} style={{ objectFit: 'contain' }} />
            </Box>
          )}

          {/* New Image Preview */}
          {imagePreview && (
            <Box sx={{ mt: 2, mb:1, textAlign: 'center' }}>
              <Typography variant="subtitle2">New Image Preview:</Typography>
              <Image src={imagePreview} alt="New image preview" width={150} height={150} style={{ maxWidth: '100%', maxHeight: '150px', marginTop: '8px', objectFit: 'contain' }} />
            </Box>
          )}

          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mt: 2, mb: 1 }}
          >
            {currentImageUrl || imagePreview ? 'Change Image' : 'Upload Image'}
            <input type="file" hidden accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageChange} />
          </Button>

          {currentImageUrl && !newImageFile && (
            <FormControlLabel
              control={<Checkbox checked={removeCurrentImage} onChange={(e) => setRemoveCurrentImage(e.target.checked)} />}
              label="Remove current image"
              sx={{display: 'block', mt:1}}
            />
          )}
          
          {(mutation.isError || (formError && formError !== 'No changes detected to update.' && formError !== 'This Pokemon was seeded and cannot be edited.' && formError !== 'You are not authorized to edit this Pokemon.' && formError !== 'Pokemon not found.' )) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError || (mutation.error instanceof Error ? mutation.error.message : 'An unexpected error occurred.')}
            </Alert>
          )}
          {formError && (formError === 'No changes detected to update.') && (
             <Alert severity="info" sx={{ mt: 2 }}>{formError}</Alert>
          )}


          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={mutation.isPending || isLoadingPokemon || !isAuthorized}>
            {mutation.isPending ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 