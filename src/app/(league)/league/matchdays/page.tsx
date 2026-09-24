"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, Calendar, Trophy, Medal, Swords, Lock, Layers, Eye } from "lucide-react";
import Link from "next/link";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface MatchdayLeader {
  id: string;
  nickname: string;
  points: number;
}

export default function MatchdaysHistoryPage() {
  const supabase = createClient();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  
  const [activeLeagues, setActiveLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);

  const [matchdays, setMatchdays] = useState<any[]>([]);
  const [selectedMatchday, setSelectedMatchday] = useState<any>(null);
  
  const [leaderboard, setLeaderboard] = useState<MatchdayLeader[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  // 1. Cargar todas las Ligas Activas
  useEffect(() => {
    const fetchLeagues = async () => {
      const { data: leagues } = await supabase
        .from("leagues")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (leagues && leagues.length > 0) {
        setActiveLeagues(leagues);
        setSelectedLeague(leagues[0]);
      }
      setLoadingInitial(false);
    };
    fetchLeagues();
  }, [supabase]);

  // 2. Cargar Fechas cuando cambia la Liga Seleccionada
  useEffect(() => {
    if (!selectedLeague) return;
    
    const fetchMatchdays = async () => {
      setLoadingContent(true);
      const { data: mdData } = await supabase
        .from("league_matchdays")
        .select("*")
        .eq("league_id", selectedLeague.id)
        .order("created_at", { ascending: false });

      if (mdData && mdData.length > 0) {
        setMatchdays(mdData);
        setSelectedMatchday(mdData[0]);
      } else {
        setMatchdays([]);
        setSelectedMatchday(null);
        setLeaderboard([]);
        setMatches([]);
        setLoadingContent(false);
      }
    };
    fetchMatchdays();
  }, [selectedLeague, supabase]);

  // 3. Cargar Leaderboard y Mesas (Incluyendo round_number)
  useEffect(() => {
    if (!selectedMatchday) return;

    const fetchMatchdayDetails = async () => {
      setLoadingContent(true);
      const { data: matchesData } = await supabase.from("league_matches").select(`
        id, table_name, is_closed, round_number,
        league_match_players (player_id, league_players(profiles(nickname))),
        league_scores (player_id, qty, league_achievements(points))
      `).eq("matchday_id", selectedMatchday.id).order("round_number", { ascending: true }).order("table_name", { ascending: true });

      if (matchesData) {
        setMatches(matchesData);
        const pointsMap = new Map<string, { nickname: string; points: number }>();

        matchesData.forEach((match: any) => {
          match.league_match_players.forEach((mp: any) => {
            if (!pointsMap.has(mp.player_id)) {
              pointsMap.set(mp.player_id, { nickname: mp.league_players?.profiles?.nickname, points: 0 });
            }
          });

          match.league_scores.forEach((score: any) => {
            const current = pointsMap.get(score.player_id);
            if (current) {
              current.points += (score.qty * score.league_achievements.points);
            }
          });
        });

        const sortedBoard = Array.from(pointsMap.entries()).map(([id, data]) => ({
          id,
          nickname: data.nickname,
          points: data.points
        })).sort((a, b) => b.points - a.points);

        setLeaderboard(sortedBoard);
      }
      setLoadingContent(false);
    };
    
    fetchMatchdayDetails();
  }, [selectedMatchday, supabase]);

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Desenterrando registros...</p>
      </div>
    );
  }

  if (activeLeagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <Calendar className="w-16 h-16 text-amber-900/50 mb-6" />
        <h1 className={`text-2xl font-black tracking-widest uppercase text-[#8a7b6b] mb-4 ${cinzel.className}`}>Sin Ligas Activas</h1>
        <p className="text-[#8a7b6b] text-sm max-w-md">No hay ligas activas para mostrar historiales.</p>
      </div>
    );
  }

  // Agrupamos las mesas por ronda para el renderizado
  const matchesByRound = matches.reduce((acc, match) => {
    const r = match.round_number || 1;
    if (!acc[r]) acc[r] = [];
    acc[r].push(match);
    return acc;
  }, {} as Record<number, any[]>);

  const roundNumbers = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b); // Orden cronológico (1, 2, 3...)

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-2">Crónicas de la Liga</p>
          <h1 className={`text-3xl sm:text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 drop-shadow-md flex items-center gap-3 ${cinzel.className}`}>
            Historial de Fechas
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {activeLeagues.length > 1 && (
            <div className="bg-black/60 border border-amber-900/30 p-2 rounded-sm w-full sm:w-48">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] mb-1 px-2">Liga</label>
              <select 
                className="w-full bg-transparent text-amber-500 font-bold uppercase tracking-wider outline-none p-2 cursor-pointer text-sm"
                value={selectedLeague?.id || ""}
                onChange={(e) => {
                  const l = activeLeagues.find(x => x.id === e.target.value);
                  if (l) setSelectedLeague(l);
                }}
              >
                {activeLeagues.map(l => (
                  <option key={l.id} value={l.id} className="bg-[#0e0917]">{l.name}</option>
                ))}
              </select>
            </div>
          )}

          {matchdays.length > 0 && (
            <div className="bg-black/60 border border-cyan-900/30 p-2 rounded-sm w-full sm:w-48">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1 px-2">Fecha</label>
              <select 
                className="w-full bg-transparent text-cyan-500 font-bold uppercase tracking-wider outline-none p-2 cursor-pointer text-sm"
                value={selectedMatchday?.id || ""}
                onChange={(e) => {
                  const md = matchdays.find(m => m.id === e.target.value);
                  if (md) setSelectedMatchday(md);
                }}
              >
                {matchdays.map(md => (
                  <option key={md.id} value={md.id} className="bg-[#0e0917]">{md.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {matchdays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-[#0e0917] border border-amber-900/30 rounded-sm">
          <Calendar className="w-12 h-12 text-amber-900/50 mb-4" />
          <h2 className={`text-xl font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Aún no hay fechas</h2>
          <p className="text-[#8a7b6b] text-sm mt-2">Esta liga acaba de comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          
          {loadingContent && (
            <div className="absolute inset-0 bg-[#050308]/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-sm">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          )}

          {/* PODIUM DE LA FECHA */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className={`text-lg font-bold uppercase tracking-widest text-[#e8e0d5] ${cinzel.className}`}>Top de la Fecha</h2>
            </div>
            
            <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-4 sticky top-24">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-[#8a7b6b] italic">No hay jugadores registrados en esta fecha.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {leaderboard.map((player, index) => {
                    let medalColor = "text-[#8a7b6b]";
                    if (index === 0) medalColor = "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]";
                    if (index === 1) medalColor = "text-gray-300";
                    if (index === 2) medalColor = "text-amber-700";

                    return (
                      <div key={player.id} className={`flex items-center justify-between p-3 border-b border-white/5 last:border-0 ${index === 0 ? 'bg-amber-500/10 rounded-sm border-amber-500/30' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-black ${medalColor}`}>{index < 3 ? <Medal className="w-5 h-5" /> : `#${index + 1}`}</span>
                          <span className={`text-sm font-bold text-[#e8e0d5] ${cinzel.className}`}>{player.nickname}</span>
                        </div>
                        <span className="text-sm font-black text-amber-400">{player.points} pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* MESAS JUGADAS POR RONDA */}
          <div className="lg:col-span-2 space-y-8">
            {roundNumbers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 bg-[#0e0917] border border-amber-900/30 rounded-sm">
                <Swords className="w-10 h-10 text-amber-900/50 mb-3" />
                <p className="text-xs text-[#8a7b6b] uppercase tracking-widest font-bold">No hay mesas generadas</p>
              </div>
            ) : (
              roundNumbers.map(roundNum => (
                <div key={roundNum} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-amber-900/30 pb-2">
                    <Layers className="w-5 h-5 text-cyan-500" />
                    <h2 className={`text-lg font-bold uppercase tracking-widest text-[#e8e0d5] ${cinzel.className}`}>
                      Ronda {roundNum}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchesByRound[roundNum].map((mesa: any) => {
                      const isClickable = mesa.is_closed;
                      // Si la mesa está cerrada, envolvemos toda la tarjeta en un Link a la sala de reporte (modo lectura)
                      const CardWrapper: any = isClickable ? Link : 'div';
                      const wrapperProps = isClickable ? { href: `/league/matches/${mesa.id}` } : {};

                      return (
                        <CardWrapper 
                          key={mesa.id} 
                          {...wrapperProps} 
                          className={`block bg-black/40 border rounded-sm p-4 relative transition-all duration-300 ${isClickable ? 'border-amber-900/30 hover:border-amber-500 hover:bg-amber-950/20 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-amber-900/10 opacity-75'}`}
                        >
                          <div className="flex justify-between items-start border-b border-amber-900/30 pb-3 mb-3">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500">{mesa.table_name}</h3>
                            {mesa.is_closed ? (
                              <span className="text-[10px] font-bold uppercase text-green-500 flex items-center gap-1 bg-green-950/40 px-2 py-0.5 rounded-sm"><Lock className="w-3 h-3"/> Finalizada</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase text-cyan-500 bg-cyan-950/40 px-2 py-0.5 rounded-sm">En Progreso</span>
                            )}
                          </div>
                          
                          <ul className="space-y-2">
                            {mesa.league_match_players.map((mp: any) => {
                              const pScores = mesa.league_scores.filter((s: any) => s.player_id === mp.player_id);
                              const points = pScores.reduce((acc: number, s: any) => acc + (s.qty * s.league_achievements.points), 0);
                              
                              return (
                                <li key={mp.player_id} className="flex justify-between items-center text-xs">
                                  <span className={`text-[#e8e0d5] ${cinzel.className}`}>{mp.league_players?.profiles?.nickname}</span>
                                  <span className="font-bold text-amber-400">{points} pts</span>
                                </li>
                              );
                            })}
                          </ul>

                          {/* Botón visual para indicar que se puede hacer clic */}
                          {isClickable && (
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-600/70 group-hover:text-amber-500 transition-colors">
                              <Eye className="w-3 h-3" /> Ver Desglose
                            </div>
                          )}
                        </CardWrapper>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}