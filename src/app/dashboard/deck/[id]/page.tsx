"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Cinzel } from "next/font/google";
import { ChevronLeft, Swords, Loader2, LayoutList, X, Save, RefreshCw, Search, ArrowDownAZ, ArrowUpZA, Filter, Layers } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deckService, InteractiveCard } from "@/lib/deckService";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import Input from "@/components/ui/Input";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface Deck {
  id: string;
  name: string;
  commander_name: string;
}

export default function DeckViewPage() {
  const params = useParams();
  const deckId = params.id as string;
  const supabase = createClient();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<InteractiveCard[]>([]);
  const [originalCards, setOriginalCards] = useState<InteractiveCard[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewCard, setPreviewCard] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"asc" | "desc">("asc");
  const [filterBy, setFilterBy] = useState<"all" | "staples" | "missing">("all");
  const [groupBy, setGroupBy] = useState<"none" | "type" | "color" | "status">("none");

  const fetchDeckData = useCallback(async () => {
    setLoading(true);
    if (!deckId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      // LLAMADA AL NUEVO SERVICIO MODULAR
      const manifest = await deckService.getDeckManifest(supabase, session.user.id, deckId);
      setDeck(manifest.deck);
      setCards(manifest.cards);
      setOriginalCards(manifest.cards);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [deckId, supabase]);

  useEffect(() => {
    fetchDeckData();
  }, [fetchDeckData]);

  const toggleStaple = (id: string) => setCards(prev => prev.map(card => card.id === id ? { ...card, isStaple: !card.isStaple } : card));
  const toggleInDeck = (id: string) => setCards(prev => prev.map(card => card.id === id ? { ...card, inDeck: !card.inDeck } : card));

  const hasChanges = JSON.stringify(cards) !== JSON.stringify(originalCards);
  const staplesCount = cards.filter(c => c.isStaple).length;

  const handleSaveChanges = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      try {
        // LLAMADA AL NUEVO SERVICIO MODULAR
        await deckService.updateDeckManifest(supabase, session.user.id, deckId, cards, originalCards);
        await fetchDeckData();
      } catch (error) {
        console.error("Error actualizando la bóveda:", error);
      }
    }
    setSaving(false);
  };

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

  const getGroupedCards = () => {
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
    Object.keys(groups).sort().forEach(key => { sortedGroups[key] = groups[key]; });
    return sortedGroups;
  };

  const groupedCards = getGroupedCards();

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 z-10 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Desbloqueando Bóveda...</p>
      </main>
    );
  }

  if (!deck) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 z-10 w-full">
        <Swords className="w-12 h-12 text-red-900 mb-4" />
        <h1 className={`text-2xl font-bold uppercase tracking-wider text-[#e8e0d5] mb-2 ${cinzel.className}`}>Mazo no encontrado</h1>
        <Link href="/dashboard" className="px-6 py-2 bg-[#1c1611]/80 border-2 border-[#8a7b6b] text-[#e8e0d5] hover:bg-[#8a7b6b]/30 rounded-sm font-bold uppercase text-xs tracking-wider transition-all">Regresar</Link>
      </main>
    );
  }

  return (
    <main className="relative flex-1 w-full max-w-5xl mx-auto px-6 py-10 z-10 flex flex-col gap-8">
      
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewCard(null)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewCard(null)} className="absolute -top-12 right-0 p-2 bg-red-950/80 border border-red-500 rounded-full text-red-400 hover:bg-red-900 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            <img src={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(previewCard)}&format=image`} alt={previewCard} className="max-w-[300px] md:max-w-[400px] rounded-[4.5%] shadow-2xl border-2 border-[#1c1611]" onError={(e) => { e.currentTarget.style.display = 'none'; alert("No se encontró imagen."); setPreviewCard(null); }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#8a7b6b] hover:text-cyan-400 transition-colors w-fit">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Volver a la Bóveda</span>
        </Link>
        {hasChanges && <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400 animate-pulse bg-emerald-950/40 px-3 py-1 rounded-sm border border-emerald-900/50"><RefreshCw className="w-3 h-3" /> Modificaciones Pendientes</span>}
      </div>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#8a7b6b]/20 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border border-cyan-800/30 rounded-full text-cyan-500 text-[10px] font-bold tracking-widest uppercase mb-3">
            <Swords className="w-3 h-3 text-cyan-500" /> Cmdr: {deck.commander_name}
          </div>
          <h1 className={`text-3xl md:text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#e8e0d5] to-[#8a7b6b] drop-shadow-md ${cinzel.className}`}>{deck.name}</h1>
          <p className="text-[#a39481] mt-2 text-sm max-w-xl">Inspecciona el registro físico de tu mazo.</p>
        </div>
        <div className="shrink-0 flex gap-4 text-center">
          <div className="bg-[#050308] border-2 border-[#1c1611] px-4 py-2 rounded-sm shadow-inner">
            <p className="text-[10px] uppercase font-bold text-[#8a7b6b] tracking-widest mb-1">Total</p>
            <p className={`text-xl font-black text-[#e8e0d5] ${cinzel.className}`}>{cards.reduce((acc, curr) => acc + curr.quantity, 0)}</p>
          </div>
          <div className="bg-[#050308] border-2 border-[#1c1611] px-4 py-2 rounded-sm shadow-inner">
            <p className="text-[10px] uppercase font-bold text-cyan-700 tracking-widest mb-1">Staples</p>
            <p className={`text-xl font-black text-cyan-400 ${cinzel.className}`}>{staplesCount}</p>
          </div>
        </div>
      </header>

      <section className="bg-[#0e0917] border-2 border-[#1c1611] rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col min-h-[50vh]">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between px-4 py-4 bg-[#050308] border-b border-[#1c1611] gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <LayoutList className="w-5 h-5 text-[#8a7b6b]" />
            <h2 className={`text-sm font-bold uppercase tracking-wider text-[#e8e0d5] hidden sm:block ${cinzel.className}`}>Manifiesto</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-48 shrink-0">
              <Input icon={<Search className="w-4 h-4" />} placeholder="Buscar carta..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="!py-2 !text-xs !bg-black/80" />
            </div>
            
            <div className="flex w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:w-32">
                <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a7b6b] pointer-events-none" />
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="w-full appearance-none pl-8 pr-2 py-2 bg-black/80 border border-[#8a7b6b]/40 rounded-sm text-[10px] text-[#e8e0d5] focus:outline-none focus:border-cyan-400 cursor-pointer font-bold uppercase tracking-wider">
                  <option value="none">Sin Grupo</option>
                  <option value="status">Por Estado</option>
                  <option value="type">Por Tipo</option>
                  <option value="color">Por Color</option>
                </select>
              </div>

              <div className="relative flex-1 sm:w-32">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a7b6b] pointer-events-none" />
                <select value={filterBy} onChange={(e) => setFilterBy(e.target.value as any)} className="w-full appearance-none pl-8 pr-2 py-2 bg-black/80 border border-[#8a7b6b]/40 rounded-sm text-[10px] text-[#e8e0d5] focus:outline-none focus:border-cyan-400 cursor-pointer font-bold uppercase tracking-wider">
                  <option value="all">Ver Todas</option>
                  <option value="staples">Solo Staples</option>
                  <option value="missing">Faltantes</option>
                </select>
              </div>

              <button onClick={() => setSortBy(prev => prev === "asc" ? "desc" : "asc")} className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-black/80 border border-[#8a7b6b]/40 hover:border-cyan-400 hover:text-cyan-400 rounded-sm text-[10px] font-bold uppercase tracking-wider text-[#8a7b6b] transition-colors" title="Ordenar alfabéticamente">
                {sortBy === "asc" ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpZA className="w-4 h-4" />}
                {sortBy === "asc" ? "A-Z" : "Z-A"}
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar h-[500px]">
          {displayedCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8a7b6b] gap-2 py-10">
              <Search className="w-8 h-8 opacity-50" />
              <p className="text-sm font-bold tracking-widest uppercase">No se encontraron cartas</p>
            </div>
          ) : (
            Object.entries(groupedCards).map(([groupName, groupCards]) => (
              <div key={groupName} className="mb-8 last:mb-0">
                {groupBy !== "none" && (
                  <h3 className={`flex items-center justify-between text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3 border-b border-[#1c1611]/60 pb-2 ${cinzel.className}`}>
                    <span>{groupName}</span>
                    <span className="text-[#8a7b6b]">{groupCards.reduce((acc, curr) => acc + curr.quantity, 0)} Cartas</span>
                  </h3>
                )}
                <div className="space-y-2">
                  {groupCards.map((card) => (
                    <div key={card.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 border-l-4 transition-colors rounded-r-sm shadow-sm ${card.isStaple ? "bg-cyan-950/10 border-cyan-800 hover:bg-cyan-950/30" : "bg-black/40 border-[#1c1611] hover:border-[#8a7b6b]/60"}`}>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className={`font-mono font-black text-sm w-6 shrink-0 ${card.isStaple ? "text-cyan-400" : "text-[#8a7b6b]"}`}>{card.quantity}x</span>
                        <div className="flex flex-col truncate">
                          <button onClick={() => setPreviewCard(card.card_name)} className={`font-bold text-sm text-left truncate hover:text-cyan-400 transition-colors ${card.isStaple ? "text-white" : "text-[#e8e0d5]"}`}>{card.card_name}</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                        <div className="flex gap-4 shrink-0 bg-[#050308] p-2 border border-[#1c1611] rounded-sm shadow-inner">
                          <Switch label="Staple" color="cyan" checked={card.isStaple} onChange={() => toggleStaple(card.id)} />
                          <div className="w-px bg-[#1c1611]"></div>
                          <Switch label="En Mazo" color="emerald" checked={card.inDeck} onChange={() => toggleInDeck(card.id)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={`relative z-10 border-t border-[#1c1611] p-6 bg-[#050308] flex justify-end items-center transition-all duration-300 ${hasChanges ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none'}`}>
          <Button variant="emerald" onClick={handleSaveChanges} isLoading={saving} disabled={!hasChanges} icon={<Save className="w-4 h-4" />}>Actualizar Bóveda</Button>
        </div>
      </section>
    </main>
  );
}