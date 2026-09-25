// Sin "use server", esto correrá en el cliente, pero Google nos dará el pase libre (CORS)

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

// Pega aquí la URL larguísima que te dio Google Apps Script (mantenla entre comillas)
const GOOGLE_PROXY_URL = "https://script.google.com/macros/s/AKfycbyGAHJ8GXxBn90Yml18474uWiOowpDW--upE9WnWDHbMJP2loQ-95duuUxA7R0enTH8Pg/exec";

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
    
    // Le pasamos la ID a nuestro proxy privado de Google
    const fetchUrl = `${GOOGLE_PROXY_URL}?id=${deckId}`;
    
    const res = await fetch(fetchUrl);
    
    if (!res.ok) {
      return { success: false, error: "El proxy de Google no pudo responder." };
    }

    const data = await res.json();
    
    // Si la data viene con error o está vacía, Moxfield lo rechazó
    if (data.error || !data.mainboard) {
      return { success: false, error: "Moxfield no entregó el mazo. Verifica que el enlace sea correcto y público." };
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
    return { success: false, error: "Ocurrió un error inesperado al descargar el mazo." };
  }
}