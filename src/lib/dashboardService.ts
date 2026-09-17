import { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardData {
  decks: any[];
  stapleGroups: any[];
}

export const dashboardService = {
  getDashboardData: async (supabase: SupabaseClient, userId: string): Promise<DashboardData> => {
    
    // 1. Obtener datos base de la colección
    const { data: decksData } = await supabase
      .from("decks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    const { data: physicalCards } = await supabase
      .from("physical_cards")
      .select("id, card_name, current_deck_id")
      .eq("user_id", userId);
    
    const deckIds = decksData?.map(d => d.id) || [];
    const { data: deckLists } = deckIds.length > 0 
      ? await supabase.from("deck_lists").select("deck_id, card_name, quantity").in("deck_id", deckIds)
      : { data: [] };

    const deckMap = new Map(decksData?.map(d => [d.id, d.name]) || []);

    // 2. Calcular Staples (La Analogía de la Manzana)
    const stapleGroups: any[] = [];
    if (physicalCards && physicalCards.length > 0) {
      const uniqueStapleNames = Array.from(new Set(physicalCards.map(c => c.card_name)));

      uniqueStapleNames.forEach(cardName => {
        // A. OFERTA: Existencia real (Solo se cuentan las copias físicas que de verdad tienes)
        const ownedCopies = physicalCards.filter(c => c.card_name === cardName);
        const totalCopies = ownedCopies.length;
        const folderCopies = ownedCopies.filter(c => c.current_deck_id === null).length;
        
        // B. DEMANDA: Lo que los mazos exigen
        const demandedInDecks = deckLists?.filter(l => l.card_name === cardName) || [];
        
        const locations: { deckName: string; qty: number }[] = [];
        const missing: { deckName: string; qty: number }[] = [];

        // C. DONANTES (Ubicaciones Físicas - Pepito tiene la manzana)
        const assignedCopies = ownedCopies.filter(c => c.current_deck_id !== null);
        const assignedDeckIds = Array.from(new Set(assignedCopies.map(c => c.current_deck_id)));
        
        assignedDeckIds.forEach(id => {
          if (id) {
            const qty = assignedCopies.filter(c => c.current_deck_id === id).length;
            locations.push({ deckName: deckMap.get(id) || "Mazo Desconocido", qty });
          }
        });

        // D. RECEPTORES FALTANTES (Juanito quiere la manzana pero no la tiene en su caja)
        demandedInDecks.forEach(demand => {
          const qtyNeeded = demand.quantity;
          const qtyAssigned = assignedCopies.filter(c => c.current_deck_id === demand.deck_id).length;
          
          if (qtyNeeded > qtyAssigned) {
            missing.push({ 
              deckName: deckMap.get(demand.deck_id) || "Mazo Desconocido", 
              qty: qtyNeeded - qtyAssigned 
            });
          }
        });

        stapleGroups.push({ cardName, totalCopies, folderCopies, locations, missing });
      });
      
      stapleGroups.sort((a, b) => a.cardName.localeCompare(b.cardName));
    }

    // 3. Calcular Estado de Completitud de los Mazos (Deckbox)
    const decksWithStatus = decksData?.map(deck => {
      let missingCount = 0;
      const deckDemand = deckLists?.filter(l => l.deck_id === deck.id) || [];
      
      deckDemand.forEach(demand => {
        // Solo alertamos si la carta es un staple rastreado
        const isTrackedAsStaple = physicalCards?.some(pc => pc.card_name === demand.card_name);
        
        if (isTrackedAsStaple) {
          // REGLA FÍSICA: ¿Cuántas copias están físicamente dentro de esta caja específica?
          const physicallyInDeck = physicalCards?.filter(pc => pc.card_name === demand.card_name && pc.current_deck_id === deck.id).length || 0;
          
          if (demand.quantity > physicallyInDeck) {
            missingCount += (demand.quantity - physicallyInDeck);
          }
        }
      });

      return {
        ...deck,
        missingCount
      };
    }) || [];

    return { decks: decksWithStatus, stapleGroups };
  }
};