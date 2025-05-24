import { NextResponse } from 'next/server';
import { pokemonService } from '@/services/pokemon.service';

export async function GET(request: Request) {
  try {
    const pokemons = await pokemonService.getAllPokemon();
    return NextResponse.json(pokemons);
  } catch (error) {
    console.error('API Error fetching Pokemon:', error);
    return NextResponse.json(
      { message: 'Error fetching Pokemon data. Please try again later.' },
      { status: 500 }
    );
  }
} 