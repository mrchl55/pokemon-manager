import { NextResponse } from 'next/server';
import { pokemonService } from '@/services/pokemon.service';

export async function GET() {
  try {
    const pokemonList = await pokemonService.getPokemonIdNameList();
    return NextResponse.json(pokemonList);
  } catch (error) {
    console.error('API Error fetching pokemon list for navigation:', error);
    return NextResponse.json({ message: 'Error fetching pokemon list' }, { status: 500 });
  }
} 