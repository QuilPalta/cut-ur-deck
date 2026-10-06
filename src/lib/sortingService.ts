import { InteractiveCard } from "./deckService";

export type SortOrder = "asc" | "desc";
export type FilterType = "all" | "staples" | "missing";
export type GroupType = "none" | "type" | "color" | "status";

// Órdenes canónicos de Magic: The Gathering y prioridades de la app
const COLOR_ORDER = ["☀️ Blanco", "💧 Azul", "💀 Negro", "🔥 Rojo", "🌳 Verde", "🌈 Multicolor", "⚪ Incoloro / Desconocido"];
const TYPE_ORDER = ["🧙‍♂️ Planeswalkers", "🗡️ Criaturas", "⚡ Instantáneos", "🔥 Conjuros", "⚙️ Artefactos", "✨ Encantamientos", "⛰️ Tierras", "❓ Tipo Desconocido"];
const STATUS_ORDER = ["🔴 Faltantes Físicos (En Carpeta)", "🟢 Staples (En Bóveda)", "⚪ Cartas Base"];

export const sortingService = {
  processCards: (
    cards: InteractiveCard[],
    searchTerm: string,
    filterBy: FilterType,
    sortBy: SortOrder,
    groupBy: GroupType
  ): Record<string, InteractiveCard[]> => {
    
    // 1. Filtrar y Ordenar (con protección contra nulos)
    const displayedCards = [...cards]
      .filter(card => (card.card_name || "").toLowerCase().includes((searchTerm || "").toLowerCase()))
      .filter(card => {
        if (filterBy === "staples") return card.isStaple;
        if (filterBy === "missing") return card.isStaple && !card.inDeck; 
        return true;
      })
      .sort((a, b) => {
        const nameA = a.card_name || "";
        const nameB = b.card_name || "";
        if (sortBy === "asc") return nameA.localeCompare(nameB);
        return nameB.localeCompare(nameA);
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
        else if (typeStr.includes("planeswalker")) groupKey = "🧙‍♂️ Planeswalkers";
        else if (typeStr.includes("instant")) groupKey = "⚡ Instantáneos";
        else if (typeStr.includes("sorcery")) groupKey = "🔥 Conjuros";
        else if (typeStr.includes("artifact")) groupKey = "⚙️ Artefactos";
        else if (typeStr.includes("enchantment")) groupKey = "✨ Encantamientos";
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

    // 3. Aplicar ordenamiento semántico en lugar de alfabético
    const sortedGroups: Record<string, InteractiveCard[]> = {};
    
    const getOrderIndex = (key: string) => {
      if (groupBy === "color") return COLOR_ORDER.indexOf(key) !== -1 ? COLOR_ORDER.indexOf(key) : 99;
      if (groupBy === "type") return TYPE_ORDER.indexOf(key) !== -1 ? TYPE_ORDER.indexOf(key) : 99;
      if (groupBy === "status") return STATUS_ORDER.indexOf(key) !== -1 ? STATUS_ORDER.indexOf(key) : 99;
      return 99;
    };

    Object.keys(groups)
      .sort((a, b) => getOrderIndex(a) - getOrderIndex(b))
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }
};