'use client'; 

import * as React from 'react';
import { AppBar, Toolbar, Typography, Container, Button, Box, CircularProgress } from '@mui/material';
import Link from 'next/link'; 
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation'; 

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  const loading = status === 'loading';

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pokemon Manager
          </Typography>
          {loading ? (
            <CircularProgress color="inherit" size={24} />
          ) : session?.user ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 2 }}>
                {session.user.name || session.user.email}
              </Typography>
              <Button color="inherit" onClick={() => signOut()}>
                Sign Out
              </Button>
            </Box>
          ) : (
            <Box>
              <Button 
                color="inherit" 
                onClick={() => router.push('/auth/login')}
              >
                Sign In
              </Button>
              <Button 
                color="inherit" 
                onClick={() => router.push('/auth/register')}
                sx={{ ml: 1 }}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to the Pokemon Manager!
        </Typography>
        <Typography paragraph>
          This is where the main content of the application will go.
          According to the designs, we need a Search Page and a Detail Page.
        </Typography>
        <Link href="/pokemon/search" passHref>
          <Button variant="contained" color="primary">
            Go to Pokemon Search
          </Button>
        </Link>
      </Container>
    </>
  );
}
