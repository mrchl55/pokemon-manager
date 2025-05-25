export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  image?: string | null;
  userId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedPokemonResponse {
  data: Pokemon[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
}

export interface PokeApiAbility {
  name: string;
  is_hidden: boolean;
}

export interface PokeApiStat {
  name: string;
  base_stat: number;
}

export interface PokeApiDetailsType {
  pokedexId?: number;
  description?: string;
  category?: string;
  types?: string[];
  abilities?: PokeApiAbility[];
  stats?: PokeApiStat[];
  gender?: string;
}

export interface CombinedPokemonDetails extends Pokemon {
  pokeApiDetails: PokeApiDetailsType | null;
}

export interface NavPokemon {
  id: number;
  name: string;
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: { name: string; url: string };
  version: { name: string; url: string };
}

export interface Genus {
  genus: string;
  language: { name: string; url: string };
}

export interface TypeInfo {
  slot: number;
  type: { name: string; url: string };
}

export interface AbilityInfo {
  ability: { name: string; url: string };
  is_hidden: boolean;
  slot: number;
}

export interface StatInfo {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface PokeApiSpeciesResponse {
  flavor_text_entries: FlavorTextEntry[];
  genera: Genus[];
  gender_rate: number;
}

export interface PokeApiPokemonResponse {
  id: number;
  types: TypeInfo[];
  abilities: AbilityInfo[];
  stats: StatInfo[];
} 