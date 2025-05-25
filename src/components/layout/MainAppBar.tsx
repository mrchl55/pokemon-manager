'use client';

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CircularProgress } from '@mui/material';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const MainAppBar: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const loadingAuth = status === 'loading';

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h5" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => router.push('/')}>
          Pokemon Manager
        </Typography>
        {loadingAuth ? (
          <CircularProgress color="inherit" size={24} />
        ) : session?.user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ mr: 2 }}>
              {session.user.name || session.user.email}
            </Typography>
            <Button color="inherit" onClick={() => signOut({ callbackUrl: '/' })}>
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
  );
};

export default MainAppBar; 