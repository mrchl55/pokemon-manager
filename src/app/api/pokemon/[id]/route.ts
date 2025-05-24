import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pokemonService } from '@/services/pokemon.service';
import { Prisma } from '@prisma/client';

interface RouteParams {
  id: string;
}

export async function GET(request: Request, { params }: { params: RouteParams }) {
  const { id } = params;
  const pokemonId = parseInt(id, 10);

  if (isNaN(pokemonId)) {
    return NextResponse.json({ message: 'Invalid Pokemon ID' }, { status: 400 });
  }

  try {
    const pokemon = await pokemonService.getPokemonById(pokemonId);
    if (!pokemon) {
      return NextResponse.json({ message: 'Pokemon not found' }, { status: 404 });
    }
    return NextResponse.json(pokemon);
  } catch (error) {
    console.error(`API Error fetching Pokemon ${pokemonId}:`, error);
    return NextResponse.json({ message: 'Error fetching Pokemon data' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: RouteParams }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const currentUserId = session.user.id;

  const { id } = params;
  const pokemonId = parseInt(id, 10);

  if (isNaN(pokemonId)) {
    return NextResponse.json({ message: 'Invalid Pokemon ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, height, weight, image } = body as { name?: string, height?: number, weight?: number, image?: string | null };

    if (Object.keys(body).length === 0) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }
    if (height !== undefined && typeof height !== 'number') {
        return NextResponse.json({ message: 'Height must be a number' }, { status: 400 });
    }
    if (weight !== undefined && typeof weight !== 'number') {
        return NextResponse.json({ message: 'Weight must be a number' }, { status: 400 });
    }

    const result = await pokemonService.updatePokemon(pokemonId, { name, height, weight, image }, currentUserId);

    if (result && typeof result === 'object' && 'error' in result && result.error && typeof result.status === 'number') {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }
    
    if (result && typeof result === 'object' && !('error' in result)) {
      return NextResponse.json(result);
    }
    
    console.error(`API error updating pokemon ${pokemonId}: Unexpected service response`, result);
    return NextResponse.json({ message: 'Error updating pokemon: Unexpected response from service' }, { status: 500 });

  } catch (error: any) {
    console.error(`API error updating pokemon ${pokemonId}:`, error);
    return NextResponse.json({ message: 'Error updating pokemon' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: RouteParams }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const currentUserId = session.user.id;

  const { id } = params;
  const pokemonId = parseInt(id, 10);

  if (isNaN(pokemonId)) {
    return NextResponse.json({ message: 'Invalid Pokemon ID' }, { status: 400 });
  }

  try {
    const result = await pokemonService.deletePokemon(pokemonId, currentUserId);

    if (result.success) {
      return new NextResponse(null, { status: 204 });
    } else {
      return NextResponse.json({ message: result.error || 'Error deleting pokemon' }, { status: result.status || 500 });
    }
  } catch (error: any) {
    console.error(`API error deleting pokemon ${pokemonId}:`, error);
    return NextResponse.json({ message: 'Error deleting pokemon' }, { status: 500 });
  }
}

