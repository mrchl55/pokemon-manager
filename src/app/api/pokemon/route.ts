import { NextResponse } from 'next/server';
import { pokemonService } from '@/services/pokemon.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const sortByParam = searchParams.get('sortBy');
  const sortOrderParam = searchParams.get('sortOrder');

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

  // validate sortOrder if provided
  let sortOrder: 'asc' | 'desc' = 'asc'; // default to 'asc'
  if (sortOrderParam) {
    if (sortOrderParam.toLowerCase() === 'asc' || sortOrderParam.toLowerCase() === 'desc') {
      sortOrder = sortOrderParam.toLowerCase() as 'asc' | 'desc';
    } else {
      return NextResponse.json(
        { message: "invalid sortOrder parameter. must be 'asc' or 'desc'." },
        { status: 400 }
      );
    }
  }

  // sortByParam can be passed directly; the service will validate it
  const sortBy = sortByParam || undefined; 

  try {
    const paginatedData = await pokemonService.getAllPokemon(page, limit, sortBy, sortOrder);
    return NextResponse.json(paginatedData);
  } catch (error) {
    // if the service throws an error due to invalid sortBy, catch it here if needed
    // for now, service logs a warning and continues without sorting for invalid sortBy
    console.error('api error fetching pokemon:', error);
    return NextResponse.json(
      { message: 'error fetching pokemon data. please try again later.' },
      { status: 500 }
    );
  }
} 