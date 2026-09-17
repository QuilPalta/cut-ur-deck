import { useState, useCallback } from "react";
import { scryfallService, ScryfallCard } from "@/lib/scryfall";

export function useScryfall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScryfallCard[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const cards = await scryfallService.searchCards(query);
      setResults(cards);
    } catch (err) {
      setError("Hubo un problema al buscar las cartas.");
    } finally {
      setLoading(false);
    }
  }, []);

  const getSuggestions = useCallback(async (partial: string) => {
    const names = await scryfallService.autocomplete(partial);
    setSuggestions(names);
  }, []);

  return {
    loading,
    error,
    results,
    suggestions,
    search,
    getSuggestions,
    getExactCard: scryfallService.getCardByName,
  };
}