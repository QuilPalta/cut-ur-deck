"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, ScrollText, Target, Dices } from "lucide-react";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface Achievement {
  id: string;
  description: string;
  points: number;
  is_random: boolean;
}

export default function AchievementsCatalogPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [fixedAchs, setFixedAchs] = useState<Achievement[]>([]);
  const [randomAchs, setRandomAchs] = useState<Achievement[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      const { data, error } = await supabase
        .from("league_achievements")
        .select("*")
        .eq("is_deprecated", false)
        .order("points", { ascending: false });

      if (data && !error) {
        setFixedAchs(data.filter(a => !a.is_random));
        setRandomAchs(data.filter(a => a.is_random));
      }
      setLoading(false);
    };

    fetchAchievements();
  }, [supabase]);

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>
          Abriendo los pergaminos...
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10">
      <header className="mb-12 text-center">
        <div className="mx-auto w-16 h-16 bg-amber-950/40 border border-amber-900/50 rounded-full flex items-center justify-center mb-6">
          <ScrollText className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className={`text-4xl md:text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#e8e0d5] to-amber-600 drop-shadow-md mb-4 ${cinzel.className}`}>
          Catálogo de Leyendas
        </h1>
        <p className="text-[#a39481] max-w-2xl mx-auto text-sm">
          Conoce las hazañas (y las desgracias) que dictarán tu destino en la liga. Los logros fijos siempre están activos; los aleatorios se deciden al inicio de cada mesa.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* COLUMNA 1: LOGROS FIJOS */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-4">
            <Target className="w-6 h-6 text-amber-500" />
            <h2 className={`text-2xl font-bold tracking-widest uppercase text-amber-500 ${cinzel.className}`}>
              Logros Fijos
            </h2>
          </div>
          
          {fixedAchs.length === 0 ? (
            <p className="text-sm text-[#8a7b6b] italic">No hay logros fijos definidos aún.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {fixedAchs.map(ach => (
                <div key={ach.id} className="bg-[#0e0917] border-l-4 border-l-amber-600 border border-y-amber-900/30 border-r-amber-900/30 p-4 rounded-sm flex items-center justify-between hover:bg-[#150d22] transition-colors">
                  <p className="text-[#e8e0d5] font-medium pr-4">{ach.description}</p>
                  <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border ${ach.points > 0 ? "bg-green-950/30 border-green-900/50 text-green-500" : "bg-red-950/30 border-red-900/50 text-red-500"}`}>
                    <span className="text-xl font-black">{ach.points > 0 ? `+${ach.points}` : ach.points}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COLUMNA 2: LOGROS ALEATORIOS */}
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-cyan-900/30 pb-4">
            <Dices className="w-6 h-6 text-cyan-500" />
            <h2 className={`text-2xl font-bold tracking-widest uppercase text-cyan-500 ${cinzel.className}`}>
              Logros al Azar
            </h2>
          </div>
          
          {randomAchs.length === 0 ? (
            <p className="text-sm text-[#8a7b6b] italic">No hay logros aleatorios definidos aún.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {randomAchs.map(ach => (
                <div key={ach.id} className="bg-[#0e0917] border-l-4 border-l-cyan-600 border border-y-cyan-900/30 border-r-cyan-900/30 p-4 rounded-sm flex items-center justify-between hover:bg-[#150d22] transition-colors">
                  <p className="text-[#e8e0d5] font-medium pr-4">{ach.description}</p>
                  <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border ${ach.points > 0 ? "bg-green-950/30 border-green-900/50 text-green-500" : "bg-red-950/30 border-red-900/50 text-red-500"}`}>
                    <span className="text-xl font-black">{ach.points > 0 ? `+${ach.points}` : ach.points}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}