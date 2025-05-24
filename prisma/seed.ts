import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PokeApiResponse {
  results: { name: string; url: string }[];
}

interface PokemonDetail {
  name: string;
  height: number;
  weight: number;
  sprites: {
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
  };
}

async function main() {
  console.log('Start seeding ...');

  const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=50');
  if (!response.ok) {
    console.error('Failed to fetch initial Pokemon list from PokeAPI');
    return;
  }
  const data: PokeApiResponse = await response.json();

  const pokemonDataToCreate = [];

  for (const pokemon of data.results) {
    try {
      const detailResponse = await fetch(pokemon.url);
      if (!detailResponse.ok) {
        console.warn(`Failed to fetch details for ${pokemon.name}`);
        continue; // skip pokemon if details can't be fetched
      }
      const detail: PokemonDetail = await detailResponse.json();

      const name = detail.name;
      const height = detail.height; 
      const weight = detail.weight; 
      const image = detail.sprites?.other?.['official-artwork']?.front_default;

      if (name && height && weight) { 
        pokemonDataToCreate.push({
          name,
          height,
          weight,
          image: image || null, // null if image is not found
        });
        console.log(`Fetched data for ${name}`);
      } else {
        console.warn(`Missing essential data for a Pokemon fetched from ${pokemon.url}`);
      }
    } catch (error) {
      console.error(`Error fetching details for ${pokemon.name}:`, error);
    }
    //  delay to avoid hitting API rate limits too quickly
    await new Promise(resolve => setTimeout(resolve, 200)); 
  }

  if (pokemonDataToCreate.length > 0) {
    const result = await prisma.pokemon.createMany({
      data: pokemonDataToCreate,
      skipDuplicates: true, // if we run the seed multiple times
    });
    console.log(`Created ${result.count} new Pokemon.`);
  } else {
    console.log('No Pokemon data to create.');
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 