'use client';

import * as React from 'react';
import {
  Grid, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Typography
} from '@mui/material';

interface PokemonFilterBarProps {
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  minHeightFilter: string;
  onMinHeightFilterChange: (value: string) => void;
  maxHeightFilter: string;
  onMaxHeightFilterChange: (value: string) => void;
  minWeightFilter: string;
  onMinWeightFilterChange: (value: string) => void;
  maxWeightFilter: string;
  onMaxWeightFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  limit: number;
  onLimitChange: (value: number) => void;
}

export default function PokemonFilterBar({
  nameFilter, onNameFilterChange,
  minHeightFilter, onMinHeightFilterChange,
  maxHeightFilter, onMaxHeightFilterChange,
  minWeightFilter, onMinWeightFilterChange,
  maxWeightFilter, onMaxWeightFilterChange,
  sortBy, onSortByChange,
  sortOrder, onSortOrderChange,
  limit, onLimitChange,
}: PokemonFilterBarProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6">Filters & Sorting</Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={2}>
          <TextField 
            fullWidth 
            label="Filter by Name" 
            value={nameFilter} 
            onChange={(e) => onNameFilterChange(e.target.value)} 
            variant="outlined" 
            size="small" 
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField 
            fullWidth 
            label="Min Height" 
            type="number" 
            value={minHeightFilter} 
            onChange={(e) => onMinHeightFilterChange(e.target.value)} 
            variant="outlined" 
            size="small" 
            InputLabelProps={{ shrink: true }} 
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField 
            fullWidth 
            label="Max Height" 
            type="number" 
            value={maxHeightFilter} 
            onChange={(e) => onMaxHeightFilterChange(e.target.value)} 
            variant="outlined" 
            size="small" 
            InputLabelProps={{ shrink: true }} 
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField 
            fullWidth 
            label="Min Weight" 
            type="number" 
            value={minWeightFilter} 
            onChange={(e) => onMinWeightFilterChange(e.target.value)} 
            variant="outlined" 
            size="small" 
            InputLabelProps={{ shrink: true }} 
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField 
            fullWidth 
            label="Max Weight" 
            type="number" 
            value={maxWeightFilter} 
            onChange={(e) => onMaxWeightFilterChange(e.target.value)} 
            variant="outlined" 
            size="small" 
            InputLabelProps={{ shrink: true }} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              label="Sort By"
              onChange={(e) => onSortByChange(e.target.value as string)}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="height">Height</MenuItem>
              <MenuItem value="weight">Weight</MenuItem>
              <MenuItem value="id">Pokedex Number</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="sort-order-label">Order</InputLabel>
            <Select
              labelId="sort-order-label"
              value={sortOrder}
              label="Order"
              onChange={(e) => onSortOrderChange(e.target.value as 'asc' | 'desc')}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="items-per-page-label">Items/Page</InputLabel>
            <Select
              labelId="items-per-page-label"
              value={limit}
              label="Items/Page"
              onChange={(e) => onLimitChange(e.target.value as number)}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
} 