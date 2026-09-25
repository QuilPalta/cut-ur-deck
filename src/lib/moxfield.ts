// ¡OJO! Ya no dice "use server" aquí arriba.

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
    let res;
    
    // 1. Intentamos la conexión directa desde el celular/PC del usuario
    try {
      res = await fetch(`https://api.moxfield.com/v2/decks/all/${deckId}`);
    } catch (e) {
      // 2. Si el navegador bloquea la conexión directa (Error de CORS), usamos este puente público
      res = await fetch(`https://corsproxy.io/?https://api.moxfield.com/v2/decks/all/${deckId}`);
    }
    
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
    console.error("Error en importDeckFromMoxfield:", err);
    return { success: false, error: "Ocurrió un error al intentar conectar con Moxfield desde tu navegador." };
  }
}