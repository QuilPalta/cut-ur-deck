"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Cinzel } from "next/font/google";
import { ChevronLeft, Swords, Loader2, LayoutList, Save, RefreshCw, Search, ArrowDownAZ, ArrowUpZA, Filter, Layers, Plus, Settings, Trash2, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { deckService, InteractiveCard } from "@/lib/deckService";
import { sortingService, FilterType, SortOrder, GroupType } from "@/lib/sortingService";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InteractiveCardRow from "@/components/InteractiveCardRow";
import CardPreviewModal from "@/components/CardPreviewModal";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface Deck {
  id: string;
  name: string;
  commander_name: string;
}

export default function DeckViewPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  const supabase = createClient();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<InteractiveCard[]>([]);
  const [originalCards, setOriginalCards] = useState<InteractiveCard[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [previewCard, setPreviewCard] = useState<string | null>(null);

  // Estados para el Modal de Ajustes del Mazo
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editDeckName, setEditDeckName] = useState("");
  const [editCommander, setEditCommander] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [sortBy, setSortBy] = useState<SortOrder>("asc");
  const [filterBy, setFilterBy] = useState<FilterType>("all");
  const [groupBy, setGroupBy] = useState<GroupType>("none");

  const fetchDeckData = useCallback(async () => {
    setLoading(true);
    if (!deckId) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    try {
      const manifest = await deckService.getDeckManifest(supabase, session.user.id, deckId);
      setDeck(manifest.deck);
      setCards(manifest.cards);
      setOriginalCards(manifest.cards);
      setEditDeckName(manifest.deck.name);
      setEditCommander(manifest.deck.commander_name);
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
        await deckService.updateDeckManifest(supabase, session.user.id, deckId, cards, originalCards);
        await fetchDeckData();
      } catch (error) {
        console.error("Error actualizando la bóveda:", error);
      }
    }
    setSaving(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim()) return;
    setAdding(true);
    try {
      await deckService.addCardToDeck(supabase, deckId, newCardName.trim(), 1);
      setNewCardName("");
      await fetchDeckData();
    } catch (error) {
      console.error("Error añadiendo carta:", error);
      alert("Error al añadir la carta. Revisa tu conexión.");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCard = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar ${name} de la lista de este mazo?`)) return;
    try {
      await deckService.removeCardFromDeck(supabase, id);
      await fetchDeckData();
    } catch (error) {
      console.error("Error eliminando carta:", error);
      alert("No se pudo eliminar la carta.");
    }
  };

  const handleUpdateMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMeta(true);
    try {
      await deckService.updateDeckMeta(supabase, deckId, editDeckName, editCommander);
      await fetchDeckData();
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Error actualizando datos:", error);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (!confirm("ADVERTENCIA: ¿Estás seguro de destruir este mazo? Esto borrará el registro logístico de todas las cartas físicas que tenga adentro. Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    try {
      await deckService.deleteDeck(supabase, deckId);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error eliminando mazo:", error);
      alert("Hubo un error al eliminar el mazo. Verifica las dependencias de tu base de datos.");
      setDeleting(false);
    }
  };

  const groupedCards = useMemo(() => 
    sortingService.processCards(cards, searchTerm, filterBy, sortBy, groupBy), 
  [cards, searchTerm, filterBy, sortBy, groupBy]);

  if (loading && !deck) {
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
      
      {previewCard && <CardPreviewModal cardName={previewCard} onClose={() => setPreviewCard(null)} />}

      {/* MODAL DE AJUSTES DEL MAZO */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e0917] border-2 border-[#1c1611] rounded-sm shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-[#8a7b6b] hover:text-[#e8e0d5] transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className={`text-xl font-bold uppercase tracking-wider text-[#e8e0d5] mb-6 ${cinzel.className}`}>Ajustes del Mazo</h2>
            
            <form onSubmit={handleUpdateMeta} className="space-y-4 mb-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8a7b6b]">Nombre del Mazo</label>
                <Input value={editDeckName} onChange={e => setEditDeckName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#8a7b6b]">Comandante Principal</label>
                <Input value={editCommander} onChange={e => setEditCommander(e.target.value)} />
              </div>
              <Button type="submit" isLoading={savingMeta} className="w-full justify-center">Guardar Cambios</Button>
            </form>

            <div className="pt-6 border-t border-red-900/30">
              <button 
                onClick={handleDeleteDeck}
                disabled={deleting}
                className="w-full py-3 flex items-center justify-center gap-2 bg-red-950/20 text-red-500 hover:bg-red-900 hover:text-white border border-red-900/50 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Destruir Mazo
              </button>
            </div>
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
          <div className="flex items-center gap-4">
            <h1 className={`text-3xl md:text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#e8e0d5] to-[#8a7b6b] drop-shadow-md ${cinzel.className}`}>
              {deck.name}
            </h1>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-[#050308] border border-[#1c1611] text-[#8a7b6b] hover:text-cyan-400 hover:border-cyan-900 rounded-sm transition-all shadow-inner mt-2 md:mt-0"
              title="Ajustes del Mazo"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#a39481] mt-2 text-sm max-w-xl">Inspecciona el registro físico de tu mazo.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {cards.some(c => c.isStaple && !c.inDeck) && (
            <Link 
              href={`/dashboard/deck/${deck.id}/rebuild`}
              className={`shrink-0 px-6 py-3 bg-gradient-to-b from-amber-600 to-amber-900 border-2 border-[#050308] rounded-sm font-bold text-white uppercase text-xs tracking-widest shadow-[0_4px_0_#020104] hover:translate-y-[2px] hover:shadow-[0_2px_0_#020104] active:translate-y-[4px] active:shadow-none transition-all ${cinzel.className}`}
            >
              Ensamblar Mazo
            </Link>
          )}
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
        </div>
      </header>

      {/* ZONA DE EDICIÓN Y FILTROS */}
      <section className="bg-[#0e0917] border-2 border-[#1c1611] rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col min-h-[50vh]">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
        
        <div className="relative z-10 flex flex-col px-4 py-4 bg-[#050308] border-b border-[#1c1611] gap-4">
          
          <form onSubmit={handleAddCard} className="flex gap-2 w-full lg:w-1/2">
            <div className="flex-1">
              <Input placeholder="Nombre exacto de la carta (Ej. Sol Ring)" value={newCardName} onChange={(e) => setNewCardName(e.target.value)} className="!py-2 !text-xs !bg-black/80" />
            </div>
            <Button type="submit" isLoading={adding} className="!py-2 !px-4" icon={<Plus className="w-4 h-4" />}>Añadir</Button>
          </form>

          <div className="h-px w-full bg-[#1c1611]"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <LayoutList className="w-5 h-5 text-[#8a7b6b]" />
              <h2 className={`text-sm font-bold uppercase tracking-wider text-[#e8e0d5] hidden sm:block ${cinzel.className}`}>Manifiesto</h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="w-full sm:w-48 shrink-0">
                <Input icon={<Search className="w-4 h-4" />} placeholder="Buscar en lista..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="!py-2 !text-xs !bg-black/80" />
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

                <button onClick={() => setSortBy(prev => prev === "asc" ? "desc" : "asc")} className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-black/80 border border-[#8a7b6b]/40 hover:border-cyan-400 hover:text-cyan-400 rounded-sm text-[10px] font-bold uppercase tracking-wider text-[#8a7b6b] transition-colors">
                  {sortBy === "asc" ? <ArrowDownAZ className="w-4 h-4" /> : <ArrowUpZA className="w-4 h-4" />}
                  {sortBy === "asc" ? "A-Z" : "Z-A"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* LISTA DE CARTAS */}
        <div className="relative z-10 p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar h-[500px]">
          {loading && cards.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8a7b6b] gap-2 py-10">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mb-2" />
            </div>
          ) : Object.keys(groupedCards).length === 0 ? (
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
                    <InteractiveCardRow
                      key={card.id}
                      id={card.id}
                      name={card.card_name}
                      quantity={card.quantity}
                      type={card.type}
                      colors={card.colors}
                      isStaple={card.isStaple}
                      inDeck={card.inDeck}
                      onPreview={setPreviewCard}
                      onToggleStaple={toggleStaple}
                      onToggleInDeck={toggleInDeck}
                      onDelete={handleDeleteCard}
                    />
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