import { PrismaClient, Pokemon } from '@prisma/client';
import { Prisma } from '@prisma/client'; 

const prisma = new PrismaClient();


const ALLOWED_PAGE_SIZES = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_SORT_BY_FIELDS = ['name', 'height', 'weight']; 

export interface PokemonFilters {
  name?: string;
  minHeight?: number;
  maxHeight?: number;
  minWeight?: number;
  maxWeight?: number;
}

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
    sortBy?: string, 
    sortOrder: 'asc' | 'desc' = 'asc', 
    filters: PokemonFilters = {}
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
      console.warn(`invalid sortBy field: ${sortBy}. defaulting to no sort.`);
    }

    const where: Prisma.PokemonWhereInput = {};
    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.minHeight !== undefined) {
      where.height = { ...where.height as Prisma.IntFilter, gte: filters.minHeight };
    }
    if (filters.maxHeight !== undefined) {
      where.height = { ...where.height as Prisma.IntFilter, lte: filters.maxHeight };
    }
    if (filters.minWeight !== undefined) {
      where.weight = { ...where.weight as Prisma.IntFilter, gte: filters.minWeight };
    }
    if (filters.maxWeight !== undefined) {
      where.weight = { ...where.weight as Prisma.IntFilter, lte: filters.maxWeight };
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
          where: where,
          orderBy: orderBy, 
        }),
        prisma.pokemon.count({ where: where }), // count all pokemon for pagination
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