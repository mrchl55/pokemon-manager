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
} from '@/types/pokemon'; // Import types

interface RouteParams {
  id: string;
}

// PokeAPI type definitions moved to @/types/pokemon.ts

const fetchPokeApiData = async (pokemonNameOrId: string | number): Promise<PokeApiDetailsType | null> => {
  try {
    const pokemonResponse = await axios.get<PokeApiPokemonResponse>(`https://pokeapi.co/api/v2/pokemon/${pokemonNameOrId.toString().toLowerCase()}`);
    const speciesResponse = await axios.get<PokeApiSpeciesResponse>(`https://pokeapi.co/api/v2/pokemon-species/${pokemonNameOrId.toString().toLowerCase()}`);
    
    const pokeApiPokemon = pokemonResponse.data;
    const pokeApiSpecies = speciesResponse.data;
console.log(pokeApiPokemon)

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

    return NextResponse.json(localPokemon); // Default: return basic data
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
    
    // This case should ideally not be reached if service responses are consistent
    console.error(`API error updating pokemon ${pokemonId}: Unexpected service response`, result);
    return NextResponse.json({ message: 'Error updating pokemon: Unexpected response from service' }, { status: 500 });

  } catch (e: unknown) { // Changed from error: any to e: unknown for better type safety
    console.error(`API error updating pokemon ${pokemonId}:`, e);
    // Explicitly type error as 'Error' or 'unknown' then check properties
    const message = e instanceof Error ? e.message : 'Error updating pokemon';
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
    // Explicitly type error as 'Error' or 'unknown' then check properties
    const message = error instanceof Error ? error.message : 'Error deleting pokemon';
    return NextResponse.json({ message }, { status: 500 });
  }
}

