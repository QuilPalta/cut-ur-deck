"use client";

import { useEffect, useState } from "react";
import { Cinzel } from "next/font/google";
import { Plus, Library, Sparkles, Loader2, Swords, Archive } from "lucide-react";
import LogisticCard from "@/components/LogisticCard";
import Deckbox from "@/components/Deckbox";
import { createClient } from "@/lib/supabase/client";
import { dashboardService } from "@/lib/dashboardService";
import Link from "next/link";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function DashboardPage() {
  const supabase = createClient();
  
  const [decks, setDecks] = useState<any[]>([]);
  const [stapleGroups, setStapleGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Toda la lógica limpia empaquetada en un servicio
        const data = await dashboardService.getDashboardData(supabase, session.user.id);
        setDecks(data.decks);
        setStapleGroups(data.stapleGroups);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [supabase]);

  return (
    <main className="relative flex-1 w-full max-w-7xl mx-auto px-6 py-10 z-10 flex flex-col gap-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#8a7b6b]/20 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border border-cyan-800/30 rounded-full text-cyan-500 text-[10px] font-bold tracking-widest uppercase mb-3">
            <Sparkles className="w-3 h-3 text-cyan-500" /> Centro de Comando
          </div>
          <h1 className={`text-4xl md:text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#e8e0d5] to-[#8a7b6b] drop-shadow-md ${cinzel.className}`}>
            Tu Bóveda
          </h1>
          <p className="text-[#a39481] mt-2 text-sm max-w-xl">
            Gestiona tus mazos, rastrea tus staples y mantén tu colección física bajo estricto control.
          </p>
        </div>

        <Link 
          href="/dashboard/new"
          className={`shrink-0 px-6 py-3 bg-gradient-to-b from-[#2a221a] to-[#1c1611] border-2 border-[#8a7b6b] text-[#e8e0d5] font-bold uppercase text-xs tracking-widest shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] hover:translate-y-px active:translate-y-[2px] transition-all flex items-center gap-2 ${cinzel.className}`}
        >
          <Plus className="w-4 h-4" /> Nuevo Mazo
        </Link>
      </header>

      {/* SECCIÓN 1: MAZOS ACTIVOS */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Library className="w-6 h-6 text-[#8a7b6b]" />
          <h2 className={`text-2xl font-bold uppercase tracking-wider text-[#e8e0d5] ${cinzel.className}`}>
            Tus Mazos
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#8a7b6b]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-700" />
            <p className={`text-xs uppercase tracking-widest font-bold ${cinzel.className}`}>Inspeccionando Bóveda...</p>
          </div>
        ) : decks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Deckbox 
                key={deck.id}
                id={deck.id}
                name={deck.name}
                commanderName={deck.commander_name}
                missingCount={deck.missingCount} // Poniendo a trabajar la nueva variable
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#050308]/60 border border-[#1c1611] border-dashed rounded-sm p-12 text-center flex flex-col items-center justify-center">
            <Swords className="w-10 h-10 text-[#8a7b6b]/50 mb-4" />
            <p className={`text-lg text-[#e8e0d5] font-bold uppercase tracking-wider mb-2 ${cinzel.className}`}>Bóveda Vacía</p>
          </div>
        )}
      </section>

      {/* SECCIÓN 2: LOGÍSTICA DE STAPLES */}
      <section className="mt-4">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#8a7b6b]" />
            <h2 className={`text-2xl font-bold uppercase tracking-wider text-[#e8e0d5] ${cinzel.className}`}>
              Staples
            </h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b]">Toca para inspeccionar</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#8a7b6b]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-700" />
          </div>
        ) : stapleGroups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-12 gap-x-8">
            {stapleGroups.map((staple, idx) => (
              <LogisticCard 
                key={idx}
                staple={staple}
                imageUrl={`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(staple.cardName)}&format=image`}
                className="w-full max-w-[240px] mx-auto"
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#050308]/60 border border-[#1c1611] border-dashed rounded-sm p-12 text-center flex flex-col items-center justify-center">
            <Archive className="w-10 h-10 text-[#8a7b6b]/50 mb-4" />
            <p className={`text-lg text-[#e8e0d5] font-bold uppercase tracking-wider mb-2 ${cinzel.className}`}>Sin Staples</p>
          </div>
        )}
      </section>

    </main>
  );
}