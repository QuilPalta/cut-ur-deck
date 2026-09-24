"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, Swords, Target, Activity, Flame, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AvatarRenderer from "@/components/AvatarRenderer";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface TopAchievement {
  description: string;
  points: number;
  timesEarned: number;
  totalPointsEarned: number;
}

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const targetPlayerId = resolvedParams.id;
  
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [playerNotFound, setPlayerNotFound] = useState(false);
  
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<any>({});
  const [stats, setStats] = useState({
    totalPoints: 0,
    matchesPlayed: 0,
    avgPoints: "0.0"
  });
  const [topAchievements, setTopAchievements] = useState<TopAchievement[]>([]);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname, avatar_config")
        .eq("id", targetPlayerId)
        .single();

      if (!profile) {
        setPlayerNotFound(true);
        setLoading(false);
        return;
      }
      setNickname(profile.nickname);
      setAvatar(profile.avatar_config || {});

      const { data: matches } = await supabase
        .from("league_match_players")
        .select("match_id, league_matches!inner(is_closed)")
        .eq("player_id", targetPlayerId)
        .eq("league_matches.is_closed", true);

      const matchesPlayed = matches ? matches.length : 0;

      const { data: scores } = await supabase
        .from("league_scores")
        .select("qty, league_achievements(id, description, points), league_matches!inner(is_closed)")
        .eq("player_id", targetPlayerId)
        .eq("league_matches.is_closed", true);

      let totalPts = 0;
      const achCountMap = new Map<string, TopAchievement>();

      if (scores) {
        scores.forEach((s: any) => {
          const achPoints = s.league_achievements.points;
          const pointsEarned = s.qty * achPoints;
          totalPts += pointsEarned;

          const achId = s.league_achievements.id;
          if (!achCountMap.has(achId)) {
            achCountMap.set(achId, {
              description: s.league_achievements.description,
              points: achPoints,
              timesEarned: 0,
              totalPointsEarned: 0
            });
          }
          const current = achCountMap.get(achId)!;
          current.timesEarned += s.qty;
          current.totalPointsEarned += pointsEarned;
        });
      }

      const sortedAchievements = Array.from(achCountMap.values())
        .sort((a, b) => b.timesEarned - a.timesEarned)
        .slice(0, 5);

      setStats({
        totalPoints: totalPts,
        matchesPlayed,
        avgPoints: matchesPlayed > 0 ? (totalPts / matchesPlayed).toFixed(1) : "0.0"
      });
      setTopAchievements(sortedAchievements);
      setLoading(false);
    };

    fetchPlayerStats();
  }, [targetPlayerId, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Consultando archivos de la liga...</p>
      </div>
    );
  }

  if (playerNotFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <ShieldAlert className="w-16 h-16 text-red-900/50 mb-6" />
        <h1 className={`text-2xl font-black tracking-widest uppercase text-red-500 mb-4 ${cinzel.className}`}>Gladiador No Encontrado</h1>
        <p className="text-[#8a7b6b] text-sm max-w-md mb-6">El perfil que buscas no existe o fue eliminado de la plataforma.</p>
        <Link href="/league" className="text-amber-500 hover:text-amber-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al Leaderboard
        </Link>
      </div>
    );
  }

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-2xl p-6 sm:p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/5 rounded-bl-full z-0 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          {/* AQUÍ INYECTAMOS EL AVATAR DEL JUGADOR */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black/60 border-2 border-amber-500/50 flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(245,158,11,0.15)] shrink-0 overflow-hidden">
            <AvatarRenderer config={avatar} className="w-full h-full scale-110 translate-y-2" />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-2">Perfil de Gladiador</p>
            <h1 className={`text-3xl sm:text-5xl font-black tracking-widest uppercase text-[#e8e0d5] drop-shadow-md mb-2 ${cinzel.className}`}>
              {nickname}
            </h1>
            <p className="text-sm text-[#8a7b6b]">Estadísticas históricas acumuladas en todas las ligas.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-4">
          <h2 className={`text-lg font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2 mb-4 ${cinzel.className}`}>
            <Activity className="w-5 h-5" /> Rendimiento Global
          </h2>
          
          <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm p-5 shadow-lg flex items-center justify-between group hover:border-amber-500/50 transition-colors">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#8a7b6b] mb-1">Puntaje Histórico</p>
              <p className={`text-3xl font-black text-amber-400 ${cinzel.className}`}>{stats.totalPoints}</p>
            </div>
            <Flame className="w-8 h-8 text-amber-900/50 group-hover:text-amber-500/50 transition-colors" />
          </div>

          <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm p-5 shadow-lg flex items-center justify-between group hover:border-amber-500/50 transition-colors">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#8a7b6b] mb-1">Mesas Disputadas</p>
              <p className={`text-3xl font-black text-[#e8e0d5] ${cinzel.className}`}>{stats.matchesPlayed}</p>
            </div>
            <Swords className="w-8 h-8 text-amber-900/50 group-hover:text-amber-500/50 transition-colors" />
          </div>

          <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm p-5 shadow-lg flex items-center justify-between group hover:border-amber-500/50 transition-colors">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#8a7b6b] mb-1">Promedio por Mesa</p>
              <p className={`text-3xl font-black text-cyan-400 ${cinzel.className}`}>{stats.avgPoints}</p>
            </div>
            <Target className="w-8 h-8 text-amber-900/50 group-hover:text-amber-500/50 transition-colors" />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className={`text-lg font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2 mb-4 ${cinzel.className}`}>
            <Target className="w-5 h-5" /> Logros Insignia
          </h2>
          <p className="text-xs text-[#8a7b6b] mb-4">Los hitos que este jugador alcanza con mayor frecuencia en la mesa de juego.</p>

          <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-4 sm:p-6">
            {topAchievements.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-[#8a7b6b] italic">Aún no hay suficientes batallas registradas para definir su estilo de juego.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topAchievements.map((ach, idx) => (
                  <div key={idx} className="bg-black/60 border border-white/5 rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors relative overflow-hidden">
                    {idx === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>}
                    
                    <div className="flex-1">
                      <p className={`text-sm ${idx === 0 ? 'text-amber-400 font-bold' : 'text-[#e8e0d5]'}`}>
                        {ach.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] uppercase tracking-widest text-[#8a7b6b] font-bold">
                          Obtenido <span className="text-cyan-400">{ach.timesEarned} veces</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4 shrink-0">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8a7b6b]">Total Aportado</span>
                      <span className={`text-xl font-black ${cinzel.className} ${ach.totalPointsEarned > 0 ? "text-green-500" : "text-red-500"}`}>
                        {ach.totalPointsEarned > 0 ? `+${ach.totalPointsEarned}` : ach.totalPointsEarned} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}