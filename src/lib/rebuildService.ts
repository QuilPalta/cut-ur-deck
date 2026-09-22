import { SupabaseClient } from "@supabase/supabase-js";

export interface RebuildItem {
  cardName: string;
  qty: number;
  copyIds: string[]; // IDs físicos para actualizar luego
}

export interface RebuildSource {
  sourceId: string | null;
  sourceName: string;
  items: RebuildItem[];
}

export const rebuildService = {
  getRebuildPlan: async (supabase: SupabaseClient, userId: string, deckId: string) => {
    const { data: deck } = await supabase.from("decks").select("*").eq("id", deckId).single();
    const { data: deckList } = await supabase.from("deck_lists").select("*").eq("deck_id", deckId);
    const { data: physicalCards } = await supabase.from("physical_cards").select("*").eq("user_id", userId);
    const { data: allDecks } = await supabase.from("decks").select("id, name").eq("user_id", userId);

    if (!deck || !deckList) throw new Error("No se pudo cargar el mazo");

    const deckMap = new Map(allDecks?.map(d => [d.id, d.name]));
    const sourcesMap = new Map<string, RebuildSource>();

    deckList.forEach(demand => {
      // 1. Verificamos si esta carta es un staple rastreado
      const ownedCopies = physicalCards?.filter(c => c.card_name === demand.card_name) || [];
      if (ownedCopies.length === 0) return; 

      // 2. ¿Cuántas nos faltan FÍSICAMENTE en este mazo?
      const inThisDeck = ownedCopies.filter(c => c.current_deck_id === deckId);
      const missingQty = demand.quantity - inThisDeck.length;

      if (missingQty > 0) {
        // 3. Buscar de dónde robar las cartas faltantes
        const available = ownedCopies.filter(c => c.current_deck_id !== deckId);
        
        // Prioridad táctica: Robar primero de la carpeta libre (null), luego de otros mazos
        available.sort((a, b) => {
          if (a.current_deck_id === null && b.current_deck_id !== null) return -1;
          if (a.current_deck_id !== null && b.current_deck_id === null) return 1;
          return 0;
        });

        // Tomamos las cartas que necesitemos (hasta donde alcance el inventario)
        const taken = available.slice(0, missingQty);

        // 4. Agrupar las instrucciones por Origen (Mazo Donante o Carpeta)
        taken.forEach(copy => {
          const sourceKey = copy.current_deck_id || "folder";
          
          if (!sourcesMap.has(sourceKey)) {
            sourcesMap.set(sourceKey, {
              sourceId: copy.current_deck_id,
              sourceName: copy.current_deck_id ? (deckMap.get(copy.current_deck_id) || "Mazo Desconocido") : "Carpeta Libre",
              items: []
            });
          }

          const source = sourcesMap.get(sourceKey)!;
          let item = source.items.find(i => i.cardName === copy.card_name);
          
          if (!item) {
            item = { cardName: copy.card_name, qty: 0, copyIds: [] };
            source.items.push(item);
          }
          item.qty += 1;
          item.copyIds.push(copy.id);
        });
      }
    });

    return {
      deck,
      plan: Array.from(sourcesMap.values())
    };
  },

  // La orden maestra: Cambia de dueño todas las cartas del plan en un solo movimiento
  executeRebuild: async (supabase: SupabaseClient, userId: string, deckId: string, copyIds: string[]) => {
    if (copyIds.length === 0) return;
    const { error } = await supabase
      .from("physical_cards")
      .update({ current_deck_id: deckId })
      .in("id", copyIds)
      .eq("user_id", userId);
      
    if (error) throw error;
  }
};