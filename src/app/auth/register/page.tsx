'use client';

import * as React from 'react';
import { Container, Typography, TextField, Button, Paper, Box, CircularProgress, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

interface RegistrationResponse {
  message?: string;
  user?: any;
}

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [session, status, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Email and Password are required.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: RegistrationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }
      
      const signInResult = await signIn('credentials', {
        redirect: false, 
        email: email,
        password: password, 
      });

      if (signInResult?.error) {
        setError(`Registration successful, but auto-login failed: ${signInResult.error}. Please login manually.`);
        setSuccess(null);
      } else if (signInResult?.ok) {
        setSuccess(data.message || 'Registration and login successful!');
        router.push('/');
      } else {
         setError('Registration successful, but auto-login failed unexpectedly. Please login manually.');
         setSuccess(null);
      }
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setSuccess(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Register
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              {success}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading || !!success}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 