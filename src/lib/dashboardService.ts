import { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardData {
  decks: any[];
  stapleGroups: any[];
}

export const dashboardService = {
  getDashboardData: async (supabase: SupabaseClient, userId: string): Promise<DashboardData> => {
    
    // 1. Obtener datos base
    const { data: decksData } = await supabase.from("decks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    const { data: physicalCards } = await supabase.from("physical_cards").select("id, card_name, current_deck_id").eq("user_id", userId);
    
    const deckIds = decksData?.map(d => d.id) || [];
    const { data: deckLists } = deckIds.length > 0 
      ? await supabase.from("deck_lists").select("deck_id, card_name, quantity").in("deck_id", deckIds)
      : { data: [] };

    const deckMap = new Map(decksData?.map(d => [d.id, d.name]) || []);

    // 2. Lógica Pura: La Manzana de Juanito y Pepito
    const stapleGroups: any[] = [];
    if (physicalCards && physicalCards.length > 0) {
      const uniqueStapleNames = Array.from(new Set(physicalCards.map(c => c.card_name)));

      uniqueStapleNames.forEach(cardName => {
        const ownedCopies = physicalCards.filter(c => c.card_name === cardName);
        const demandedInDecks = deckLists?.filter(l => l.card_name === cardName) || [];
        
        const locations: { deckName: string; qty: number }[] = [];
        const missing: { deckName: string; qty: number }[] = [];

        // A. UBICACIONES FÍSICAS (¿Qué cajas tienen la manzana HOY?)
        // Como ya no hay carpeta, ignoramos cualquier valor nulo si existiera por error en BD vieja.
        const validCopies = ownedCopies.filter(c => c.current_deck_id !== null);
        const assignedDeckIds = Array.from(new Set(validCopies.map(c => c.current_deck_id)));
        
        assignedDeckIds.forEach(id => {
          if (id) {
            const qty = validCopies.filter(c => c.current_deck_id === id).length;
            locations.push({ deckName: deckMap.get(id) || "Mazo Desconocido", qty });
          }
        });

        // B. RECEPTORES FALTANTES (¿Quién quiere la manzana pero no la tiene en su caja?)
        demandedInDecks.forEach(demand => {
          const qtyNeeded = demand.quantity;
          // ¿Cuántas copias están FÍSICAMENTE adentro de este mazo específico?
          const physicallyInThisDeck = validCopies.filter(c => c.current_deck_id === demand.deck_id).length;
          
          if (qtyNeeded > physicallyInThisDeck) {
            missing.push({ 
              deckName: deckMap.get(demand.deck_id) || "Mazo Desconocido", 
              qty: qtyNeeded - physicallyInThisDeck 
            });
          }
        });

        stapleGroups.push({ 
          cardName, 
          totalCopies: validCopies.length, // Solo contamos las que están asignadas a un mazo
          locations, 
          missing 
        });
      });
      
      stapleGroups.sort((a, b) => a.cardName.localeCompare(b.cardName));
    }

    // 3. Calcular Incompletitud Automática para los Deckboxes
    const decksWithStatus = decksData?.map(deck => {
      let missingCount = 0;
      const deckDemand = deckLists?.filter(l => l.deck_id === deck.id) || [];
      
      deckDemand.forEach(demand => {
        const isTrackedAsStaple = physicalCards?.some(pc => pc.card_name === demand.card_name);
        if (isTrackedAsStaple) {
          // La misma regla: si necesitas 1, pero tienes 0 físicamente adentro, te falta 1.
          const physicallyInDeck = physicalCards?.filter(pc => pc.card_name === demand.card_name && pc.current_deck_id === deck.id).length || 0;
          if (demand.quantity > physicallyInDeck) {
            missingCount += (demand.quantity - physicallyInDeck);
          }
        }
      });

      return { ...deck, missingCount };
    }) || [];

    return { decks: decksWithStatus, stapleGroups };
  }
};