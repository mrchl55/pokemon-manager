import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { pokemonService } from '@/services/pokemon.service';
import axios from 'axios';
import { 
  FlavorTextEntry, 
  Genus, 
  TypeInfo, 
  AbilityInfo, 
  StatInfo, 
  PokeApiSpeciesResponse, 
  PokeApiPokemonResponse, 
  PokeApiDetailsType
} from '@/types/pokemon'; 
import fs from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client'; 

interface RouteParams {
  id: string;
}

const fetchPokeApiData = async (pokemonNameOrId: string | number): Promise<PokeApiDetailsType | null> => {
  try {
    const pokemonResponse = await axios.get<PokeApiPokemonResponse>(`https://pokeapi.co/api/v2/pokemon/${pokemonNameOrId.toString().toLowerCase()}`);
    const speciesResponse = await axios.get<PokeApiSpeciesResponse>(`https://pokeapi.co/api/v2/pokemon-species/${pokemonNameOrId.toString().toLowerCase()}`);
    
    const pokeApiPokemon = pokemonResponse.data;
    const pokeApiSpecies = speciesResponse.data;

    const PREFERRED_GAME_VERSIONS_FOR_DESCRIPTION = ['scarlet', 'violet', 'sword', 'shield', 'sun', 'moon', 'ultra-sun', 'ultra-moon', 'lets-go-pikachu', 'lets-go-eevee', 'x', 'y', 'omega-ruby', 'alpha-sapphire'];

    const englishFlavorTexts = pokeApiSpecies.flavor_text_entries.filter(
      (entry: FlavorTextEntry) => entry.language.name === 'en'
    );

    let description = 'No description available.';
    if (englishFlavorTexts.length > 0) {
      let foundPreferred = false;
      for (const version of PREFERRED_GAME_VERSIONS_FOR_DESCRIPTION) {
        const preferredEntry = englishFlavorTexts.find(
          (entry: FlavorTextEntry) => entry.version.name === version
        );
        if (preferredEntry) {
          description = preferredEntry.flavor_text.replace(/\f|\n/g, ' ');
          foundPreferred = true;
          break;
        }
      }
      if (!foundPreferred) {
        description = englishFlavorTexts[0].flavor_text.replace(/\f|\n/g, ' ');
      }
    }
    
    const category = pokeApiSpecies.genera
      .find((genus: Genus) => genus.language.name === 'en')
      ?.genus || 'Unknown';

    const types = pokeApiPokemon.types.map((typeInfo: TypeInfo) => typeInfo.type.name);
    const abilities = pokeApiPokemon.abilities.map((abilityInfo: AbilityInfo) => ({
      name: abilityInfo.ability.name,
      is_hidden: abilityInfo.is_hidden,
    }));
    const stats = pokeApiPokemon.stats.map((statInfo: StatInfo) => ({
      name: statInfo.stat.name,
      base_stat: statInfo.base_stat,
    }));

    const genderRate = pokeApiSpecies.gender_rate;
    let gender = 'Genderless';
    if (genderRate !== -1) {
        const femalePercentage = (genderRate / 8) * 100;
        const malePercentage = 100 - femalePercentage;
        gender = `M: ${malePercentage}%, F: ${femalePercentage}%`;
        if (femalePercentage === 0) gender = 'Male only';
        if (malePercentage === 0) gender = 'Female only';
    }

    const pokedexId = pokeApiPokemon.id;

    return {
      pokedexId,
      description,
      category,
      types,
      abilities,
      stats,
      gender,
    };
  } catch (error) {
    console.warn(`Failed to fetch extended details from PokeAPI for ${pokemonNameOrId}:`, error);
    return null;
  }
};

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

export async function GET(request: Request,  context: { params: Promise<{ id: number }> }) {
  const { id } = await context.params;
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
      return NextResponse.json({ message: 'Pokemon not found for update check' }, { status: 404 });
    }

    let newImageFilePath: string | null | undefined = undefined; // undefined means no change, null means remove

    if (imageFile && imageFile.size > 0) {
      if (pokemonToUpdate.image && pokemonToUpdate.image.startsWith('/uploads/pokemon/')) {
        const oldImagePath = path.join(process.cwd(), 'public', pokemonToUpdate.image);
        try {
          await fs.unlink(oldImagePath);
        } catch (unlinkError: any) {
          if (unlinkError.code !== 'ENOENT') { // Ignore if file doesn't exist
             console.warn(`Could not delete old image ${oldImagePath}:`, unlinkError);
          }
        }
      }

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pokemon');
      await fs.mkdir(uploadsDir, { recursive: true });
      const originalFilename = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '');
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = uniqueSuffix + '-' + originalFilename;
      const fullFilePath = path.join(uploadsDir, filename);
      if (!imageFile.stream) return NextResponse.json({ message: 'Image file stream is not available.'}, {status: 400});
      const buffer = await streamToBuffer(imageFile.stream());
      await fs.writeFile(fullFilePath, buffer);
      newImageFilePath = `/uploads/pokemon/${filename}`;
      updatePayload.image = newImageFilePath;
    } else if (imageToBeRemoved) {
      if (pokemonToUpdate.image && pokemonToUpdate.image.startsWith('/uploads/pokemon/')) {
        const oldImagePath = path.join(process.cwd(), 'public', pokemonToUpdate.image);
        try {
          await fs.unlink(oldImagePath);
        } catch (unlinkError: any) {
           if (unlinkError.code !== 'ENOENT') {
             console.warn(`Could not delete old image ${oldImagePath}:`, unlinkError);
           }
        }
      }
      updatePayload.image = null; 
      updatePayload.imageToBeRemoved = true; 
    }

    if (Object.keys(updatePayload).length === 0 && newImageFilePath === undefined && !imageToBeRemoved) {
        return NextResponse.json({ message: 'No update data provided' }, { status: 400 });
    }

    const result = await pokemonService.updatePokemon(pokemonId, updatePayload, currentUserId);

    if (result && typeof result === 'object' && 'error' in result && result.error && typeof result.status === 'number') {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }
    if (result && typeof result === 'object' && !('error' in result)) {
      return NextResponse.json(result);
    }
    
    console.error(`API error updating pokemon ${pokemonId}: Unexpected service response`, result);
    return NextResponse.json({ message: 'Error updating pokemon: Unexpected response from service' }, { status: 500 });

  } catch (e: unknown) {
    console.error(`API error updating pokemon ${pokemonId}:`, e);
    let message = 'Error updating pokemon';
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
  } catch (error) {
    console.error(`API error deleting pokemon ${pokemonId}:`, error);
    const message = error instanceof Error ? error.message : 'Error deleting pokemon';
    return NextResponse.json({ message }, { status: 500 });
  }
}

