'use client';

import * as React from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Alert, CircularProgress
} from '@mui/material';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  error: Error | null;
  pokemonName?: string; 
}

export default function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  error,
  pokemonName = 'this Pokemon' 
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete {pokemonName}? This action cannot be undone.
          {error && <Alert severity="error" sx={{mt:2}}>{error.message}</Alert>}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button onClick={onConfirm} color="error" disabled={isPending}>
          {isPending ? <CircularProgress size={24} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 