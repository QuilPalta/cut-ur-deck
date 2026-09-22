import { SupabaseClient } from "@supabase/supabase-js";
import { ParsedCard } from "./moxfield";

export interface InteractiveCard {
  id: string;
  card_name: string;
  quantity: number;
  isStaple: boolean;
  inDeck: boolean;
  staple_id?: string;
  type?: string;
  colors?: string[];
}

export const deckService = {
  
  createDeck: async (supabase: SupabaseClient, userId: string, deckName: string, commanderName: string, parsedCards: ParsedCard[]) => {
    const { data: deckData, error: deckError } = await supabase.from("decks").insert({
      user_id: userId,
      name: deckName.trim() === "" ? "Mazo sin título" : deckName.trim(),
      commander_name: commanderName
    }).select().single();

    if (deckError) throw deckError;
    if (!deckData) throw new Error("Posible bloqueo RLS.");

    const newDeckId = deckData.id;

    const deckListsToInsert = parsedCards.map(c => ({
      deck_id: newDeckId, card_name: c.name, quantity: c.qty, is_commander: false, type_line: c.type, colors: c.colors
    }));

    const { error: listError } = await supabase.from("deck_lists").insert(deckListsToInsert);
    if (listError) throw listError;

    const staples = parsedCards.filter(c => c.isStaple);
    const { data: existingPhysical } = await supabase.from("physical_cards").select("id, card_name, current_deck_id").eq("user_id", userId);
    let localPhysical = existingPhysical ? [...existingPhysical] : [];
    
    for (const card of staples) {
      const owned = localPhysical.filter(p => p.card_name === card.name);
      
      if (card.inDeck) {
        const free = owned.find(p => p.current_deck_id === null);
        if (free) {
          await supabase.from("physical_cards").update({ current_deck_id: newDeckId }).eq("id", free.id);
          free.current_deck_id = newDeckId; 
        } else {
          const { data } = await supabase.from("physical_cards").insert({ user_id: userId, card_name: card.name, current_deck_id: newDeckId }).select().single();
          if (data) localPhysical.push(data);
        }
      } else {
        if (owned.length === 0) {
          const { data } = await supabase.from("physical_cards").insert({ user_id: userId, card_name: card.name, current_deck_id: null }).select().single();
          if (data) localPhysical.push(data);
        }
      }
    }

    return newDeckId;
  },

  getDeckManifest: async (supabase: SupabaseClient, userId: string, deckId: string) => {
    const { data: deck } = await supabase.from("decks").select("*").eq("id", deckId).single();
    if (!deck) throw new Error("Mazo no encontrado");

    const { data: listData } = await supabase.from("deck_lists").select("*").eq("deck_id", deckId);
    if (!listData) return { deck, cards: [] };

    const cardNames = listData.map((c: any) => c.card_name);
    const { data: staplesData } = await supabase.from("physical_cards").select("id, card_name, current_deck_id").eq("user_id", userId).in("card_name", cardNames);

    const mappedCards: InteractiveCard[] = listData.map((card: any) => {
      const copies = staplesData?.filter((s: any) => s.card_name === card.card_name) || [];
      const isStaple = copies.length > 0;
      let inDeck = false;
      let staple_id = undefined;

      if (isStaple) {
        const copyInThisDeck = copies.find(c => c.current_deck_id === deckId);
        if (copyInThisDeck) {
          inDeck = true; staple_id = copyInThisDeck.id;
        } else {
          const freeCopy = copies.find(c => c.current_deck_id === null);
          if (freeCopy) {
            inDeck = false; staple_id = freeCopy.id;
          }
        }
      } else {
        inDeck = true;
      }

      return {
        id: card.id, card_name: card.card_name, quantity: card.quantity, isStaple, inDeck, staple_id, type: card.type_line || "", colors: card.colors || []
      };
    });

    return { deck, cards: mappedCards };
  },

  updateDeckManifest: async (supabase: SupabaseClient, userId: string, deckId: string, currentCards: InteractiveCard[], originalCards: InteractiveCard[]) => {
    const { data: existingPhysical } = await supabase.from("physical_cards").select("*").eq("user_id", userId);
    let localPhysical = existingPhysical ? [...existingPhysical] : [];

    for (const card of currentCards) {
      const original = originalCards.find(c => c.id === card.id);
      if (!original) continue;

      const ownedOfThisCard = localPhysical.filter(p => p.card_name === card.card_name);

      if (!original.isStaple && card.isStaple) {
        if (card.inDeck) {
          const freeCopy = ownedOfThisCard.find(p => p.current_deck_id === null);
          if (freeCopy) {
            await supabase.from("physical_cards").update({ current_deck_id: deckId }).eq("id", freeCopy.id);
            freeCopy.current_deck_id = deckId;
          } else {
            const { data } = await supabase.from("physical_cards").insert({ user_id: userId, card_name: card.card_name, current_deck_id: deckId }).select().single();
            if (data) localPhysical.push(data);
          }
        } else {
          if (ownedOfThisCard.length === 0) {
            const { data } = await supabase.from("physical_cards").insert({ user_id: userId, card_name: card.card_name, current_deck_id: null }).select().single();
            if (data) localPhysical.push(data);
          }
        }
      } 
      else if (original.isStaple && !card.isStaple) {
        if (original.staple_id) {
          await supabase.from("physical_cards").delete().eq("id", original.staple_id);
          localPhysical = localPhysical.filter(p => p.id !== original.staple_id);
        }
      } 
      else if (original.isStaple && card.isStaple && original.inDeck !== card.inDeck) {
        if (card.inDeck) {
          if (original.staple_id) {
            await supabase.from("physical_cards").update({ current_deck_id: deckId }).eq("id", original.staple_id);
            const p = localPhysical.find(p => p.id === original.staple_id);
            if (p) p.current_deck_id = deckId;
          } else {
            const freeCopy = ownedOfThisCard.find(p => p.current_deck_id === null);
            if (freeCopy) {
              await supabase.from("physical_cards").update({ current_deck_id: deckId }).eq("id", freeCopy.id);
              freeCopy.current_deck_id = deckId;
            } else {
              const { data } = await supabase.from("physical_cards").insert({ user_id: userId, card_name: card.card_name, current_deck_id: deckId }).select().single();
              if (data) localPhysical.push(data);
            }
          }
        } else {
          if (original.staple_id) {
            await supabase.from("physical_cards").update({ current_deck_id: null }).eq("id", original.staple_id);
            const p = localPhysical.find(p => p.id === original.staple_id);
            if (p) p.current_deck_id = null;
          }
        }
      }
    }
  },

  // NUEVOS MÉTODOS PARA EL EDITOR DINÁMICO
  addCardToDeck: async (supabase: SupabaseClient, deckId: string, cardName: string, qty: number) => {
    let typeLine = "Carta";
    let colors: string[] = [];
    
    // Obtenemos los metadatos de Scryfall para mantener las agrupaciones por color/tipo funcionando
    try {
      const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
      if (res.ok) {
        const data = await res.json();
        typeLine = data.type_line || typeLine;
        colors = data.color_identity || [];
      }
    } catch (e) {
      console.warn("No se pudo obtener datos de Scryfall para:", cardName);
    }

    const { error } = await supabase.from("deck_lists").insert({
      deck_id: deckId,
      card_name: cardName,
      quantity: qty,
      type_line: typeLine,
      colors: colors
    });

    if (error) throw error;
  },

  removeCardFromDeck: async (supabase: SupabaseClient, cardId: string) => {
    const { error } = await supabase.from("deck_lists").delete().eq("id", cardId);
    if (error) throw error;
  }
};