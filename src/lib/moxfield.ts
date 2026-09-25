"use server";

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
    
    // Hacemos la petición disfrazados de un navegador de escritorio (Google Chrome) para pasar Cloudflare
    const res = await fetch(`https://api.moxfield.com/v2/decks/all/${deckId}`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive"
      },
      // Evita que Next.js guarde en caché un error antiguo de Moxfield
      cache: "no-store" 
    });
    
    if (!res.ok) {
      // Si a pesar del disfraz nos bloquean, devolvemos el código de error limpio para la interfaz
      return { 
        success: false, 
        error: `Moxfield denegó el acceso (Error ${res.status}). Verifica que el mazo sea público.` 
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
    console.error("Error crítico en backend importDeckFromMoxfield:", err);
    return { success: false, error: "El servidor de Vercel falló al intentar conectar con Moxfield." };
  }
}