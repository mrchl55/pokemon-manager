import { PrismaClient, Pokemon } from '@prisma/client';

const prisma = new PrismaClient();

// define the allowed page sizes
const ALLOWED_PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;

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
    limit: number = DEFAULT_PAGE_SIZE
  ): Promise<PaginatedPokemonResponse> {
    // ensure page is at least 1
    const currentPage = Math.max(1, page);
    // validate and set page size
    const pageSize = ALLOWED_PAGE_SIZES.includes(limit) ? limit : DEFAULT_PAGE_SIZE;

    const offset = (currentPage - 1) * pageSize;

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
          // we'll add orderBy here later for sorting
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