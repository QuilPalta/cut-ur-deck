import { InteractiveCard } from "./deckService";

export type SortOrder = "asc" | "desc";
export type FilterType = "all" | "staples" | "missing";
export type GroupType = "none" | "type" | "color" | "status";

export const sortingService = {
  processCards: (
    cards: InteractiveCard[],
    searchTerm: string,
    filterBy: FilterType,
    sortBy: SortOrder,
    groupBy: GroupType
  ): Record<string, InteractiveCard[]> => {
    
    // 1. Filtrar y Ordenar
    const displayedCards = [...cards]
      .filter(card => card.card_name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(card => {
        if (filterBy === "staples") return card.isStaple;
        if (filterBy === "missing") return card.isStaple && !card.inDeck; 
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "asc") return a.card_name.localeCompare(b.card_name);
        return b.card_name.localeCompare(a.card_name);
      });

    // 2. Agrupar
    if (groupBy === "none") return { "Todas las cartas": displayedCards };

    const groups: Record<string, InteractiveCard[]> = {};

    displayedCards.forEach(card => {
      let groupKey = "Otros";

      if (groupBy === "status") {
        if (card.isStaple && !card.inDeck) groupKey = "🔴 Faltantes Físicos (En Carpeta)";
        else if (card.isStaple && card.inDeck) groupKey = "🟢 Staples (En Bóveda)";
        else groupKey = "⚪ Cartas Base";
      } 
      else if (groupBy === "type") {
        const typeStr = card.type?.toLowerCase() || "";
        if (!typeStr) groupKey = "❓ Tipo Desconocido";
        else if (typeStr.includes("creature")) groupKey = "🗡️ Criaturas";
        else if (typeStr.includes("instant")) groupKey = "⚡ Instantáneos";
        else if (typeStr.includes("sorcery")) groupKey = "🔥 Conjuros";
        else if (typeStr.includes("artifact")) groupKey = "⚙️ Artefactos";
        else if (typeStr.includes("enchantment")) groupKey = "✨ Encantamientos";
        else if (typeStr.includes("planeswalker")) groupKey = "🧙‍♂️ Planeswalkers";
        else if (typeStr.includes("land")) groupKey = "⛰️ Tierras";
      } 
      else if (groupBy === "color") {
        const colors = card.colors || [];
        if (colors.length === 0) groupKey = "⚪ Incoloro / Desconocido";
        else if (colors.length > 1) groupKey = "🌈 Multicolor";
        else {
          if (colors[0] === "W") groupKey = "☀️ Blanco";
          else if (colors[0] === "U") groupKey = "💧 Azul";
          else if (colors[0] === "B") groupKey = "💀 Negro";
          else if (colors[0] === "R") groupKey = "🔥 Rojo";
          else if (colors[0] === "G") groupKey = "🌳 Verde";
        }
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(card);
    });

    const sortedGroups: Record<string, InteractiveCard[]> = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key];
    });

    return sortedGroups;
  }
};