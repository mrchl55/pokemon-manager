import { NextResponse } from 'next/server';
import { pokemonService } from '@/services/pokemon.service';

export async function GET(request: Request) {
  try {
    const pokemonList = await pokemonService.getPokemonIdNameList();
    return NextResponse.json(pokemonList);
  } catch (error) {
    console.error('API Error fetching Pokemon list for navigation:', error);
    return NextResponse.json({ message: 'Error fetching Pokemon list for navigation' }, { status: 500 });
  }
} 