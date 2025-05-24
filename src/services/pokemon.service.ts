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
    const currentPage = Math.max(1, page);
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

  async createPokemon(data: { name: string; height: number; weight: number; image?: string | null }) {
    // additional validation could be done here if needed
    try {
      const newPokemon = await prisma.pokemon.create({
        data: {
          name: data.name,
          height: data.height,
          weight: data.weight,
          image: data.image || null, 
        },
        select: { // select the fields to return
          id: true,
          name: true,
          height: true,
          weight: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      return newPokemon;
    } catch (error) {
      // the route handler will catch PrismaClientKnownRequestError for unique constraints
      console.error('error creating pokemon in service:', error);
      throw error; // re-throw the error to be handled by the route
    }
  }

  async updatePokemon(id: number, data: { name?: string; height?: number; weight?: number; image?: string | null }) {
    try {
      const pokemonToUpdate = await prisma.pokemon.findUnique({ where: { id } });
      if (!pokemonToUpdate) {
        return null; 
      }

      const updateData: Prisma.PokemonUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.height !== undefined) updateData.height = data.height;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.image !== undefined) updateData.image = data.image; 

      if (Object.keys(updateData).length === 0) {
     
        return pokemonToUpdate; 
      }
      
      const updatedPokemon = await prisma.pokemon.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          height: true,
          weight: true,
          image: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      return updatedPokemon;
    } catch (error) {
      // specific errors like P2002 (unique constraint) will be caught by route handler
      console.error(`error updating pokemon with id ${id} in service:`, error);
      throw error; // re-throw
    }
  }

  async deletePokemon(id: number): Promise<boolean> {
    try {
 
      // alternatively, we can findUnique first if we want to return a more specific boolean/object.
      await prisma.pokemon.delete({
        where: { id },
      });
      return true; // successfully deleted
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        console.warn(`pokemon with id ${id} not found for deletion.`);
        return false; 
      }
      console.error(`error deleting pokemon with id ${id} in service:`, error);
      throw error; // re-throw other errors
    }
  }
}

export const pokemonService = new PokemonService(); 