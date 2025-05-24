import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pokemonService } from '@/services/pokemon.service';
import { Prisma } from '@prisma/client';

interface RouteParams {
  id: string;
}

export async function PUT(request: Request, { params }: { params: RouteParams }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'unauthorized. please log in.' }, { status: 401 });
  }

  const { id } = params;
  const pokemonId = parseInt(id, 10);

  if (isNaN(pokemonId)) {
    return NextResponse.json({ message: 'invalid pokemon id' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, height, weight, image } = body as { name?: string, height?: number, weight?: number, image?: string | null };

    if (Object.keys(body).length === 0) {
        return NextResponse.json({ message: 'no update data provided' }, { status: 400 });
    }
    if (height !== undefined && typeof height !== 'number') {
        return NextResponse.json({ message: 'height must be a number' }, { status: 400 });
    }
    if (weight !== undefined && typeof weight !== 'number') {
        return NextResponse.json({ message: 'weight must be a number' }, { status: 400 });
    }

    const updatedPokemon = await pokemonService.updatePokemon(pokemonId, { name, height, weight, image });
    if (!updatedPokemon) {

      return NextResponse.json({ message: 'pokemon not found or update failed' }, { status: 404 });
    }
    return NextResponse.json(updatedPokemon);

  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002' && error.meta?.target === 'Pokemon_name_key') { 
        return NextResponse.json({ message: 'a pokemon with this name already exists' }, { status: 409 });
      }
      if (error.code === 'P2025') { 
        return NextResponse.json({ message: 'pokemon not found' }, { status: 404 });
      }
    }
    console.error(`api error updating pokemon ${pokemonId}:`, error);
    return NextResponse.json({ message: 'error updating pokemon' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: RouteParams }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'unauthorized. please log in.' }, { status: 401 });
  }

  const { id } = params;
  const pokemonId = parseInt(id, 10);

  if (isNaN(pokemonId)) {
    return NextResponse.json({ message: 'invalid pokemon id' }, { status: 400 });
  }

  try {
    const wasDeleted = await pokemonService.deletePokemon(pokemonId);
    if (!wasDeleted) {
      return NextResponse.json({ message: 'pokemon not found' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 }); 
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') { 
        return NextResponse.json({ message: 'pokemon not found' }, { status: 404 });
      }
    }
    console.error(`api error deleting pokemon ${pokemonId}:`, error);
    return NextResponse.json({ message: 'error deleting pokemon' }, { status: 500 });
  }
}

