import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PokemonService {
  async getAllPokemon() {
    try {
      const pokemons = await prisma.pokemon.findMany({
        select: {
          name: true,
          height: true,
          weight: true,
          image: true,
        },
      });
      return pokemons;
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
      throw new Error('Failed to fetch Pokemon data.');
    }
  }
}

export const pokemonService = new PokemonService(); 