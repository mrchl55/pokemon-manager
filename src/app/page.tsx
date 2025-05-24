'use client'; // Make it a client component

import * as React from 'react';
import { AppBar, Toolbar, Typography, Container, Button, Box } from '@mui/material';
import Link from 'next/link'; // For client-side navigation
import { useSession, signIn, signOut } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pokemon Manager
          </Typography>
          {session?.user ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 2 }}>
                Welcome, {session.user.name || session.user.email}!
              </Typography>
              <Button color="inherit" onClick={() => signOut()}>
                Sign Out
              </Button>
            </Box>
          ) : (
            <Button color="inherit" onClick={() => signIn()}>
              Sign In
            </Button>
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
