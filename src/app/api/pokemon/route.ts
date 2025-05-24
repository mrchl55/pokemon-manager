import { NextResponse } from 'next/server';
import { pokemonService } from '@/services/pokemon.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  // parse page and limit, providing defaults if not present or invalid
  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 10; // default limit to 10

  // basic validation for page and limit to ensure they are numbers
  if (isNaN(page) || isNaN(limit)) {
    return NextResponse.json(
      { message: 'invalid page or limit parameter. they must be numbers.' },
      { status: 400 }
    );
  }

  try {
    const paginatedData = await pokemonService.getAllPokemon(page, limit);
    return NextResponse.json(paginatedData);
  } catch (error) {
    console.error('api error fetching pokemon:', error);
    return NextResponse.json(
      { message: 'error fetching pokemon data. please try again later.' },
      { status: 500 }
    );
  }
} 