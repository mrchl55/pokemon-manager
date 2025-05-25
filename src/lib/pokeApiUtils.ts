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

const PREFERRED_GAME_VERSIONS_FOR_DESCRIPTION = [
  'scarlet', 'violet', 'sword', 'shield', 'sun', 'moon', 
  'ultra-sun', 'ultra-moon', 'lets-go-pikachu', 'lets-go-eevee', 
  'x', 'y', 'omega-ruby', 'alpha-sapphire'
];

/**
 * Fetches extended Pokemon details (description, category, types, abilities, stats, gender)
 * from the external PokeAPI for a given Pokemon name or Pokedex ID.
 * @param pokemonNameOrId - The name or Pokedex ID of the Pokemon.
 * @returns A Promise that resolves to PokeApiDetailsType or null if an error occurs.
 */
export const fetchPokeApiData = async (pokemonNameOrId: string | number): Promise<PokeApiDetailsType | null> => {
  try {
    const nameOrIdLower = pokemonNameOrId.toString().toLowerCase();
    const pokemonResponse = await axios.get<PokeApiPokemonResponse>(`https://pokeapi.co/api/v2/pokemon/${nameOrIdLower}`);
    const speciesResponse = await axios.get<PokeApiSpeciesResponse>(`https://pokeapi.co/api/v2/pokemon-species/${nameOrIdLower}`);
    
    const pokeApiPokemon = pokemonResponse.data;
    const pokeApiSpecies = speciesResponse.data;

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