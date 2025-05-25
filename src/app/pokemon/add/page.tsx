'use client';

import * as React from 'react';
import { Container, Typography, TextField, Button, Paper, Box, CircularProgress, Alert } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';


const createPokemonWithUpload = async (formData: FormData) => {
  const response = await fetch('/api/pokemon', {
    method: 'POST',
    body: formData, 
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
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createPokemonWithUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pokemons'] });
      router.push('/'); 
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

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
    if (imageFile && imageFile.size > 5 * 1024 * 1024) { // 5MB limit
        setFormError('Image size should not exceed 5MB.');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('height', height);
    formData.append('weight', weight);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    mutation.mutate(formData);
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
        <Box component="form" onSubmit={handleSubmit} noValidate encType="multipart/form-data">
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
            label="Height (e.g., 0.7 for 0.7m)"
            name="height"
            type="number"
            InputProps={{ inputProps: { step: "0.1" } }}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            error={!!formError && (!height || isNaN(Number(height)))}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="weight"
            label="Weight (e.g., 6.9 for 6.9kg)"
            name="weight"
            type="number"
            InputProps={{ inputProps: { step: "0.1" } }}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            error={!!formError && (!weight || isNaN(Number(weight)))}
          />
          
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mt: 2, mb: 1 }}
          >
            Upload Image
            <input
              type="file"
              hidden
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={handleImageChange}
            />
          </Button>
          {imagePreview && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="subtitle2">Image Preview:</Typography>
              <Image src={imagePreview} alt="Preview" width={200} height={200} style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '200px', marginTop: '8px' }} />
            </Box>
          )}
          {formError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {mutation.error instanceof Error ? mutation.error.message : 'An unexpected error occurred.'}
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