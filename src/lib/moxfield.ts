"use server";

export interface ParsedCard {
  id: string;
  qty: number;
  name: string;
  type: string;
  colors: string[];
  isStaple: boolean;
  inDeck: boolean; // NUEVO: Define si físicamente irá en este mazo
}

export async function importDeckFromMoxfield(url: string): Promise<{ name: string; cards: ParsedCard[] }> {
  if (!url.trim()) throw new Error("Ingresa un enlace válido de Moxfield.");

  const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("No se pudo identificar la ID del mazo en el enlace.");

  const deckId = match[1];
  
  const res = await fetch(`https://api.moxfield.com/v2/decks/all/${deckId}`, {
    headers: {
      "User-Agent": "CutUrDeck/1.0",
      "Accept": "application/json"
    }
  });
  
  if (!res.ok) throw new Error("No se pudo obtener el mazo. Verifica que el enlace sea correcto y público.");

  const data = await res.json();
  const cards: ParsedCard[] = [];
  let idCounter = 0;

  const parseSection = (section: any) => {
    if (!section) return;
    Object.values(section).forEach((item: any) => {
      cards.push({
        id: String(idCounter++),
        qty: item.quantity || 1,
        name: item.card?.name || "Desconocido",
        type: item.card?.type_line || "Carta",
        colors: item.card?.color_identity || [],
        isStaple: false,
        inDeck: true, // Por defecto, asumimos que si la importas, la meterás al mazo
      });
    });
  };

  parseSection(data.commanders);
  parseSection(data.companions);
  parseSection(data.mainboard);
  parseSection(data.sideboard); // Por si tienes tokens, companions o extras aquí

  if (cards.length === 0) throw new Error("No se detectaron cartas en la importación.");

  return { name: data.name, cards };
}