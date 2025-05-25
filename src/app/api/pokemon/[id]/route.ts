import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pokemonService } from '@/services/pokemon.service';
import fs from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client'; 
import { streamToBuffer } from '@/lib/imageUtils';
import { deleteUploadedImageIfExists } from '@/lib/imageUtils';
import { fetchPokeApiData } from '@/lib/pokeApiUtils';

interface RouteParams {
  id: string;
}

export async function GET(request: Request,  context: { params: RouteParams }) {
  const { id } = context.params;
  const pokemonDbId = +id
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (isNaN(pokemonDbId)) {
    return NextResponse.json({ message: 'Invalid Pokemon ID' }, { status: 400 });
  }

  try {
    const localPokemon = await pokemonService.getPokemonById(pokemonDbId);
    if (!localPokemon) {
      return NextResponse.json({ message: 'Pokemon not found' }, { status: 404 });
    }

    if (view === 'details') {
      const pokeApiDetails = await fetchPokeApiData(localPokemon.name);
      const combinedData = {
        ...localPokemon,
        pokeApiDetails: pokeApiDetails,
      };
      return NextResponse.json(combinedData);
    }

    return NextResponse.json(localPokemon); 
  } catch (error) {
    console.error(`API Error fetching Pokemon ${pokemonDbId}:`, error);
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
    const formData = await request.formData();
    const name = formData.get('name') as string | undefined;
    const heightStr = formData.get('height') as string | undefined;
    const weightStr = formData.get('weight') as string | undefined;
    const imageFile = formData.get('image') as File | null;
    const imageToBeRemovedStr = formData.get('removeImage') as string | undefined;
    const imageToBeRemoved = imageToBeRemovedStr === 'true';

    const updatePayload: { name?: string; height?: number; weight?: number; image?: string | null; imageToBeRemoved?: boolean } = {};

    if (name) updatePayload.name = name;
    if (heightStr) {
      const height = parseFloat(heightStr);
      if (isNaN(height)) return NextResponse.json({ message: 'Height must be a valid number' }, { status: 400 });
      updatePayload.height = height;
    }
    if (weightStr) {
      const weight = parseFloat(weightStr);
      if (isNaN(weight)) return NextResponse.json({ message: 'Weight must be a valid number' }, { status: 400 });
      updatePayload.weight = weight;
    }

    const pokemonToUpdate = await pokemonService.getPokemonById(pokemonId);
    if (!pokemonToUpdate) {
      return NextResponse.json({ message: 'Pokemon not found' }, { status: 404 });
    }

    if (imageFile && imageFile.size > 0) {
      await deleteUploadedImageIfExists(pokemonToUpdate.image);

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pokemon');
      await fs.mkdir(uploadsDir, { recursive: true });
      const originalFilename = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + '-' + originalFilename;
      const fullFilePath = path.join(uploadsDir, filename);
      if (!imageFile.stream) return NextResponse.json({ message: 'Image file stream is not available.'}, {status: 400});
      const buffer = await streamToBuffer(imageFile.stream());
      await fs.writeFile(fullFilePath, buffer);
      updatePayload.image = `/uploads/pokemon/${filename}`;
    } else if (imageToBeRemoved) {
      await deleteUploadedImageIfExists(pokemonToUpdate.image);
      updatePayload.image = null;
      updatePayload.imageToBeRemoved = true;
    }

    if (Object.keys(updatePayload).length === 0) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    const result = await pokemonService.updatePokemon(pokemonId, updatePayload, currentUserId);

    if (result && typeof result === 'object' && 'error' in result && result.error) {
      const status = typeof result.status === 'number' ? result.status : 400;
      return NextResponse.json({ message: result.error }, { status });
    }
    
    return NextResponse.json(result);

  } catch (e: unknown) {
    console.error(`API error updating pokemon ${pokemonId}:`, e);
    let message = 'Error updating pokemon';
    let status = 500;
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      message = 'A Pokemon with this name already exists.';
      status = 409;
    } else if (e instanceof Error) {
        message = e.message;
    }
    return NextResponse.json({ message }, { status });
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
    const pokemonToDelete = await pokemonService.getPokemonById(pokemonId);
    if (pokemonToDelete) {
        await deleteUploadedImageIfExists(pokemonToDelete.image);
    }

    const result = await pokemonService.deletePokemon(pokemonId, currentUserId);

    if (result.success) {
      return new NextResponse(null, { status: 204 });
    } else {
      return NextResponse.json({ message: result.error || 'Error deleting pokemon' }, { status: result.status || 500 });
    }
  } catch (error: unknown) {
    console.error(`API error deleting pokemon ${pokemonId}:`, error);
    const message = error instanceof Error ? error.message : 'Error deleting pokemon';
    return NextResponse.json({ message }, { status: 500 });
  }
}

