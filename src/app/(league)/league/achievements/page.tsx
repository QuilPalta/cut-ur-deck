"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, ScrollText, Target, Dices, Trophy, Info } from "lucide-react";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface Achievement {
  id: string;
  description: string;
  points: number;
  is_random: boolean;
}

export default function PublicAchievementsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  const [activeLeague, setActiveLeague] = useState<any>(null);
  const [fixedAchievements, setFixedAchievements] = useState<Achievement[]>([]);
  const [randomAchievements, setRandomAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const fetchLeagueRules = async () => {
      // 1. Buscar la liga activa (asumimos la más reciente si hubiera varias)
      const { data: leagues } = await supabase
        .from("leagues")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!leagues || leagues.length === 0) {
        setLoading(false);
        return;
      }
      
      const currentLeague = leagues[0];
      setActiveLeague(currentLeague);

      // 2. Extraer el catálogo de logros mapeados a esta liga
      const { data: achievementMap } = await supabase
        .from("league_achievement_map")
        .select("league_achievements(id, description, points, is_random)")
        .eq("league_id", currentLeague.id);

      if (achievementMap) {
        const allAchievements = achievementMap.map((am: any) => am.league_achievements);
        
        // Separar entre fijos y aleatorios
        setFixedAchievements(allAchievements.filter((a: any) => !a.is_random));
        setRandomAchievements(allAchievements.filter((a: any) => a.is_random));
      }

      setLoading(false);
    };

    fetchLeagueRules();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Desplegando pergaminos...</p>
      </div>
    );
  }

  if (!activeLeague) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <ScrollText className="w-16 h-16 text-amber-900/50 mb-6" />
        <h1 className={`text-2xl font-black tracking-widest uppercase text-[#8a7b6b] mb-4 ${cinzel.className}`}>Sin Reglas Activas</h1>
        <p className="text-[#8a7b6b] text-sm max-w-md">No hay ninguna liga en curso en este momento para mostrar su catálogo.</p>
      </div>
    );
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {/* ENCABEZADO */}
      <header className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-amber-900/30 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-2 flex items-center justify-center sm:justify-start gap-2">
            <Trophy className="w-4 h-4" /> {activeLeague.name}
          </p>
          <h1 className={`text-3xl sm:text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 drop-shadow-md flex items-center justify-center sm:justify-start gap-3 ${cinzel.className}`}>
            <ScrollText className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 hidden sm:block" />
            Catálogo de Reglas
          </h1>
        </div>
        <div className="bg-black/40 border border-amber-900/30 p-3 rounded-sm flex items-center gap-3 max-w-xs text-left mx-auto sm:mx-0">
          <Info className="w-8 h-8 text-[#8a7b6b] shrink-0" />
          <p className="text-[10px] text-[#8a7b6b] uppercase tracking-wider leading-tight">
            Estos son los logros oficiales que otorgan o restan puntos durante la temporada actual.
          </p>
        </div>
      </header>

      {/* SECCIÓN 1: LOGROS FIJOS */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-amber-500" />
          <div>
            <h2 className={`text-2xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>Logros Fijos</h2>
            <p className="text-sm text-[#8a7b6b]">Activos en todas las mesas. Puedes obtenerlos múltiples veces a menos que se indique lo contrario.</p>
          </div>
        </div>

        {fixedAchievements.length === 0 ? (
          <div className="p-8 bg-[#0e0917] border border-amber-900/30 rounded-sm text-center text-[#8a7b6b] text-sm">
            No hay logros fijos configurados para esta liga.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixedAchievements.map(ach => (
              <div key={ach.id} className="bg-[#0e0917] border border-amber-900/30 p-5 rounded-sm hover:border-amber-500/50 hover:bg-amber-950/10 transition-all shadow-lg flex flex-col justify-between gap-4 group">
                <p className="text-sm text-[#e8e0d5] leading-relaxed group-hover:text-white transition-colors">
                  {ach.description}
                </p>
                <div className="flex justify-end border-t border-white/5 pt-3">
                  <span className={`text-xl font-black ${cinzel.className} ${ach.points > 0 ? "text-green-500" : "text-red-500"} drop-shadow-md`}>
                    {ach.points > 0 ? `+${ach.points}` : ach.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN 2: LOGROS ALEATORIOS (DADOS) */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Dices className="w-6 h-6 text-cyan-500" />
          <div>
            <h2 className={`text-2xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>Pool de Dados</h2>
            <p className="text-sm text-[#8a7b6b]">De esta reserva, el sistema extraerá 6 logros al azar para cada mesa generada.</p>
          </div>
        </div>

        {randomAchievements.length === 0 ? (
          <div className="p-8 bg-[#0e0917] border border-cyan-900/30 rounded-sm text-center text-[#8a7b6b] text-sm">
            No hay logros aleatorios configurados para esta liga.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {randomAchievements.map(ach => (
              <div key={ach.id} className="bg-black/60 border border-cyan-900/20 p-4 rounded-sm hover:border-cyan-500/50 hover:bg-cyan-950/20 transition-all flex flex-col justify-between gap-3 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-900/20 rounded-bl-full z-0"></div>
                <p className="text-xs text-[#a39481] group-hover:text-[#e8e0d5] transition-colors relative z-10">
                  {ach.description}
                </p>
                <div className="flex justify-end relative z-10">
                  <span className={`text-lg font-black ${cinzel.className} ${ach.points > 0 ? "text-cyan-400" : "text-red-400"}`}>
                    {ach.points > 0 ? `+${ach.points}` : ach.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}