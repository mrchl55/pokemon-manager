'use client';

import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import MainAppBar from '@/components/layout/MainAppBar';

const queryClient = new QueryClient();

const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6', 
    },
    secondary: {
      main: '#19857b', 
    },
    mode: 'light', 
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline /> {/* MUI's normalization, similar to tailwind preflight but for MUI */}
          <MainAppBar />
          {children}
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
} 