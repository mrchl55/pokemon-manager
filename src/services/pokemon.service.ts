import { Pokemon } from '@prisma/client';
import { Prisma } from '@prisma/client'; 
import { prisma } from '@/lib/prisma';

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
  data: Pick<Pokemon, 'id' | 'name' | 'height' | 'weight' | 'image' | 'userId'>[];
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
            id: true,
            name: true,
            height: true,
            weight: true,
            image: true,
            userId: true,
          },
          where: where,
          orderBy: orderBy, 
        }),
        prisma.pokemon.count({ where: where }), // count all pokemon for pagination
      ]);

      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        data: pokemons as Pick<Pokemon, 'id' | 'name' | 'height' | 'weight' | 'image' | 'userId'>[],
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

  async getPokemonById(id: number): Promise<Pokemon | null> {
    try {
      const pokemon = await prisma.pokemon.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          height: true,
          weight: true,
          image: true,
          createdAt: true, 
          updatedAt: true,
          userId: true,
        }
      });
      return pokemon;
    } catch (error) {
      console.error(`Error fetching pokemon with id ${id} in service:`, error);
      throw new Error(`Failed to fetch pokemon with id ${id}`);
    }
  }

  async createPokemon(data: { name: string; height: number; weight: number; image?: string | null; userId: string }) {
    // additional validation could be done here if needed
    try {
      const newPokemon = await prisma.pokemon.create({
        data: {
          name: data.name,
          height: data.height,
          weight: data.weight,
          image: data.image || null, 
          userId: data.userId,
        },
        select: { // select the fields to return
          id: true,
          name: true,
          height: true,
          weight: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        }
      });
      return newPokemon;
    } catch (error) {
      // the route handler will catch PrismaClientKnownRequestError for unique constraints
      console.error('error creating pokemon in service:', error);
      throw error; // re-throw the error to be handled by the route
    }
  }

  async updatePokemon(id: number, data: { name?: string; height?: number; weight?: number; image?: string | null }, currentUserId: string): Promise<Pokemon | null | { error: string, status: number }> {
    try {
      const pokemonToUpdate = await prisma.pokemon.findUnique({ 
        where: { id },
        select: { userId: true, name: true, height: true, weight: true, image: true, id: true, createdAt:true, updatedAt:true } // Select userId to check ownership
      });

      if (!pokemonToUpdate) {
        return { error: 'Pokemon not found', status: 404 };
      }

      if (pokemonToUpdate.userId === null) {
        return { error: 'Seeded Pokemon cannot be updated', status: 403 }; // Forbidden
      }

      if (pokemonToUpdate.userId !== currentUserId) {
        return { error: 'User not authorized to update this Pokemon', status: 403 }; // Forbidden
      }

      const updateData: Prisma.PokemonUpdateInput = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.height !== undefined) updateData.height = data.height;
      if (data.weight !== undefined) updateData.weight = data.weight;
      // Ensure image can be set to null explicitly
      if (data.image !== undefined) updateData.image = data.image; 

      if (Object.keys(updateData).length === 0) {
        // No actual data changes provided, return current pokemon data
        // This might be debatable, could also be a 400 error
        return pokemonToUpdate as Pokemon;
      }
      
      const updatedPokemon = await prisma.pokemon.update({
        where: { id },
        data: updateData,
        select: { // Ensure all relevant fields are returned
          id: true,
          name: true,
          height: true,
          weight: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        }
      });
      return updatedPokemon;
    } catch (error) {
      console.error(`Error updating pokemon with id ${id} in service:`, error);
      // Re-throw to be handled by the route, or return a generic error object
      // throw error; 
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { error: 'A Pokemon with this name already exists', status: 409 };
      }
      return { error: 'Failed to update pokemon', status: 500 };
    }
  }

  async deletePokemon(id: number, currentUserId: string): Promise<{ success: boolean; error?: string; status?: number }> {
    try {
      const pokemonToDelete = await prisma.pokemon.findUnique({
        where: { id },
        select: { userId: true } // Only need userId for this check
      });

      if (!pokemonToDelete) {
        return { success: false, error: 'Pokemon not found', status: 404 };
      }

      if (pokemonToDelete.userId === null) {
        return { success: false, error: 'Seeded Pokemon cannot be deleted', status: 403 };
      }

      if (pokemonToDelete.userId !== currentUserId) {
        return { success: false, error: 'User not authorized to delete this Pokemon', status: 403 };
      }

      await prisma.pokemon.delete({
        where: { id },
      });
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        console.warn(`Pokemon with id ${id} not found for deletion (P2025).`);
        return { success: false, error: 'Pokemon not found', status: 404 };
      }
      console.error(`Error deleting pokemon with id ${id} in service:`, error);
      return { success: false, error: 'Failed to delete pokemon', status: 500 };
    }
  }

  async getPokemonIdNameList(): Promise<{ id: number; name: string }[]> {
    try {
      const pokemonList = await prisma.pokemon.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
      return pokemonList;
    } catch (error) {
      console.error('Error fetching Pokemon ID/Name list in service:', error);
      throw new Error('Failed to fetch Pokemon list for navigation');
    }
  }
}

export const pokemonService = new PokemonService(); 