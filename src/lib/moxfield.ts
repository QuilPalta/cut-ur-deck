export interface ParsedCard {
  id: string;
  qty: number;
  name: string;
  type: string;
  colors: string[];
  isStaple: boolean;
  inDeck: boolean; // Define si físicamente irá en este mazo
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
    const moxfieldApiUrl = `https://api.moxfield.com/v2/decks/all/${deckId}`;
    
    let data;

    try {
      // Usamos AllOrigins para evadir tanto el CORS del navegador como los bloqueos de Cloudflare
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(moxfieldApiUrl)}`;
      const res = await fetch(proxyUrl);
      
      if (!res.ok) throw new Error("Fallo en el proxy de AllOrigins.");

      const proxyData = await res.json();
      
      // AllOrigins devuelve un objeto con una propiedad "contents" que es un gran string.
      if (!proxyData.contents) throw new Error("Respuesta vacía del proxy.");

      // Convertimos el string gigante en el objeto JSON de Moxfield
      data = JSON.parse(proxyData.contents);
      
    } catch (e) {
      console.error("Fallo de conexión proxy:", e);
      return { success: false, error: "No se pudo conectar con Moxfield. La API podría estar saturada o bloqueando la conexión." };
    }

    // Si Moxfield devolvió un error (ej. mazo privado o ID falsa), su JSON trae una propiedad "error"
    // O si falta el mainboard, sabemos que no es un mazo válido
    if (data.error || !data.mainboard) {
      return { success: false, error: "Moxfield rechazó la petición. Verifica que el enlace sea correcto y que el mazo sea público." };
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
    return { success: false, error: "Ocurrió un error inesperado al procesar las cartas." };
  }
}