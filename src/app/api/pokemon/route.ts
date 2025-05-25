import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pokemonService, PokemonFilters } from '@/services/pokemon.service';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const sortByParam = searchParams.get('sortBy');
  const sortOrderParam = searchParams.get('sortOrder');

  // filter params
  const nameFilter = searchParams.get('name');
  const minHeightParam = searchParams.get('minHeight');
  const maxHeightParam = searchParams.get('maxHeight');
  const minWeightParam = searchParams.get('minWeight');
  const maxWeightParam = searchParams.get('maxWeight');

  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  if (isNaN(page) || isNaN(limit)) {
    return NextResponse.json(
      { message: 'invalid page or limit parameter. they must be numbers.' },
      { status: 400 }
    );
  }

  let sortOrder: 'asc' | 'desc' = 'asc';
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
  const sortBy = sortByParam || undefined;

  const filters: PokemonFilters = {};
  if (nameFilter) filters.name = nameFilter;
  
  // helper to parse number params for filters
  const parseNumericParam = (param: string | null): number | undefined => {
    if (param === null) return undefined;
    const num = parseInt(param, 10);
    return isNaN(num) ? undefined : num;
  };

  filters.minHeight = parseNumericParam(minHeightParam);
  filters.maxHeight = parseNumericParam(maxHeightParam);
  filters.minWeight = parseNumericParam(minWeightParam);
  filters.maxWeight = parseNumericParam(maxWeightParam);

  // validate range filters (min <= max)
  if (filters.minHeight !== undefined && filters.maxHeight !== undefined && filters.minHeight > filters.maxHeight) {
    return NextResponse.json({ message: 'invalid height range: minHeight cannot be greater than maxHeight.' }, { status: 400 });
  }
  if (filters.minWeight !== undefined && filters.maxWeight !== undefined && filters.minWeight > filters.maxWeight) {
    return NextResponse.json({ message: 'invalid weight range: minWeight cannot be greater than maxWeight.' }, { status: 400 });
  }

  try {
    const paginatedData = await pokemonService.getAllPokemon(page, limit, sortBy, sortOrder, filters);
    return NextResponse.json(paginatedData);
  } catch (error) {
    console.error('api error fetching pokemon:', error);
    return NextResponse.json(
      { message: 'error fetching pokemon data. please try again later.' },
      { status: 500 }
    );
  }
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized. Please log in.' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const heightStr = formData.get('height') as string;
    const weightStr = formData.get('weight') as string;
    const imageFile = formData.get('image') as File | null;

    if (!name || !heightStr || !weightStr) {
      return NextResponse.json({ message: 'Name, height, and weight are required' }, { status: 400 });
    }

    const height = parseFloat(heightStr);
    const weight = parseFloat(weightStr);

    if (isNaN(height) || isNaN(weight)) {
      return NextResponse.json({ message: 'Height and weight must be valid numbers' }, { status: 400 });
    }

    let imagePath: string | null = null;
    if (imageFile && imageFile.size > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pokemon');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const originalFilename = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + '-' + originalFilename;
      const fullFilePath = path.join(uploadsDir, filename);
      
      if (!imageFile.stream) {
        return NextResponse.json({ message: 'Image file stream is not available.' }, { status: 400 });
      }
      const buffer = await streamToBuffer(imageFile.stream());
      await fs.writeFile(fullFilePath, buffer);
      imagePath = `/uploads/pokemon/${filename}`;
    }

    const newPokemon = await pokemonService.createPokemon({
      name,
      height,
      weight,
      image: imagePath,
      userId,
    });

    return NextResponse.json(newPokemon, { status: 201 });
  } catch (e: unknown) {
    console.error('API Error creating pokemon:', e);
    let message = 'Error creating pokemon';
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      message = 'A Pokemon with this name already exists.';
      return NextResponse.json({ message }, { status: 409 });
    }
    if (e instanceof Error) {
        message = e.message;
    }
    return NextResponse.json({ message }, { status: 500 });
  }
} 