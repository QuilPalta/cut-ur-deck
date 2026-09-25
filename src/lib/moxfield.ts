export interface ParsedCard {
  id: string;
  qty: number;
  name: string;
  type: string;
  colors: string[];
  isStaple: boolean;
  inDeck: boolean; 
}

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
    
    // Nuestro Caballo de Troya: El proxy de Cloudflare Workers
    const workerUrl = `https://old-bush-3d68.quilpalta.workers.dev/?id=${deckId}`;
    
    const res = await fetch(workerUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      return { 
        success: false, 
        error: `Error al conectar mediante el Proxy (Error ${res.status}). Verifica que el enlace sea correcto y público.` 
      };
    }

    const data = await res.json();
    
    if (data.error || !data.mainboard) {
      return { success: false, error: "Moxfield no devolvió un mazo válido. Podría estar configurado como privado." };
    }

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

    return { success: true, data: { name: data.name || "Mazo Importado", cards } };
    
  } catch (err) {
    console.error("Error crítico en importDeckFromMoxfield:", err);
    return { success: false, error: "Fallo de conexión. El firewall de Moxfield podría estar bloqueando el proxy." };
  }
}