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

// NUEVO: Definimos el tipo de respuesta estandarizada para Server Actions
export type MoxfieldImportResult = 
  | { success: true; data: { name: string; cards: ParsedCard[] } }
  | { success: false; error: string };

export async function importDeckFromMoxfield(url: string): Promise<MoxfieldImportResult> {
  try {
    if (!url.trim()) {
      return { success: false, error: "Ingresa un enlace válido de Moxfield." };
    }

    const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return { success: false, error: "No se pudo identificar la ID del mazo en el enlace." };
    }

    const deckId = match[1];
    
    const res = await fetch(`https://api.moxfield.com/v2/decks/all/${deckId}`, {
      headers: {
        // Moxfield agradece si pones un contacto, evita bloqueos futuros
        "User-Agent": "CutUrDeck/1.0 (contacto@cuturdeck.site)", 
        "Accept": "application/json"
      }
    });
    
    if (!res.ok) {
      return { success: false, error: "No se pudo obtener el mazo. Verifica que el enlace sea correcto y público." };
    }

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
          inDeck: true, 
        });
      });
    };

    parseSection(data.commanders);
    parseSection(data.companions);
    parseSection(data.mainboard);
    parseSection(data.sideboard); 

    if (cards.length === 0) {
      return { success: false, error: "No se detectaron cartas en la importación." };
    }

    return { success: true, data: { name: data.name, cards } };
    
  } catch (err) {
    // Si fetch falla por red o json() da error, lo atrapamos aquí sin tumbar el servidor
    console.error("Error en importDeckFromMoxfield:", err);
    return { success: false, error: "Ocurrió un error interno al intentar conectar con Moxfield." };
  }
}