const SCRYFALL_BASE_URL = "https://api.scryfall.com";

export interface ScryfallCard {
  id: string;
  name: string;
  type_line: string;
  mana_cost: string;
  cmc: number;
  color_identity: string[];
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    art_crop: string;
  };
  set_name: string;
  rarity: string;
}

// Scryfall pide amablemente que las apps se identifiquen y especifiquen el formato
const headers = {
  "Accept": "application/json",
  "User-Agent": "CutUrDeck/1.0",
};

export const scryfallService = {
  /**
   * Busca cartas por un query general (ej. "t:creature c:u")
   */
  searchCards: async (query: string): Promise<ScryfallCard[]> => {
    try {
      const response = await fetch(`${SCRYFALL_BASE_URL}/cards/search?q=${encodeURIComponent(query)}`, { 
        headers 
      });
      if (!response.ok) throw new Error("No se encontraron cartas");
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error en Scryfall Search:", error);
      return [];
    }
  },

  /**
   * Obtiene la coincidencia exacta de una carta por su nombre (ideal para importar listas)
   */
  getCardByName: async (exactName: string): Promise<ScryfallCard | null> => {
    try {
      const response = await fetch(`${SCRYFALL_BASE_URL}/cards/named?exact=${encodeURIComponent(exactName)}`, { 
        headers 
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error obteniendo carta exacta:", error);
      return null;
    }
  },

  /**
   * Autocompletado rápido (devuelve solo un array de nombres, ideal para inputs de búsqueda)
   */
  autocomplete: async (partialName: string): Promise<string[]> => {
    if (partialName.length < 2) return [];
    try {
      const response = await fetch(`${SCRYFALL_BASE_URL}/cards/autocomplete?q=${encodeURIComponent(partialName)}`, { 
        headers 
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error en autocompletado:", error);
      return [];
    }
  }
};