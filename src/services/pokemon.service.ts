import { PrismaClient, Pokemon } from '@prisma/client';
import { Prisma } from '@prisma/client'; // import Prisma for types

const prisma = new PrismaClient();

// define the allowed page sizes
const ALLOWED_PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_SORT_BY_FIELDS = ['name', 'height', 'weight']; // define allowed sort fields

export interface PaginatedPokemonResponse {
  data: Pick<Pokemon, 'name' | 'height' | 'weight' | 'image'>[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export class PokemonService {
  async getAllPokemon(
    page: number = 1,
    limit: number = DEFAULT_PAGE_SIZE,
    sortBy?: string, // make sortBy optional
    sortOrder: 'asc' | 'desc' = 'asc' // default sortOrder to 'asc'
  ): Promise<PaginatedPokemonResponse> {
    // ensure page is at least 1
    const currentPage = Math.max(1, page);
    // validate and set page size
    const pageSize = ALLOWED_PAGE_SIZES.includes(limit) ? limit : DEFAULT_PAGE_SIZE;

    const offset = (currentPage - 1) * pageSize;

    // prepare orderBy clause for prisma
    let orderBy: Prisma.PokemonOrderByWithRelationInput | undefined = undefined;
    if (sortBy && ALLOWED_SORT_BY_FIELDS.includes(sortBy)) {
      orderBy = { [sortBy]: sortOrder };
    } else if (sortBy) {
      // if sortBy is provided but not allowed, log a warning or handle as an error
      console.warn(`invalid sortBy field: ${sortBy}. defaulting to no sort.`);
      // or you could throw an error: throw new Error(`Invalid sortBy field: ${sortBy}`);
    }

    try {
      const [pokemons, totalItems] = await prisma.$transaction([
        prisma.pokemon.findMany({
          skip: offset,
          take: pageSize,
          select: {
            name: true,
            height: true,
            weight: true,
            image: true,
          },
          orderBy: orderBy, // apply sorting
        }),
        prisma.pokemon.count(), // count all pokemon for pagination
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        data: pokemons,
        totalItems,
        currentPage,
        totalPages,
        pageSize,
      };
    } catch (error) {
      console.error('error fetching pokemon:', error);
      throw new Error('failed to fetch pokemon data');
    }
  }
}

export const pokemonService = new PokemonService(); 