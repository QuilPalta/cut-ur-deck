"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, Swords, Trophy, Crown, AlertCircle, ArrowRight, Dices } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import AvatarRenderer from "@/components/AvatarRenderer";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface LeaderboardPlayer {
  id: string;
  nickname: string;
  avatar_config: any;
  points: number;
  matchesPlayed: number;
  wins: number;
  isAbsoluteTie?: boolean;
}

export default function LeaguePublicPage() {
  const supabase = createClient();
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  
  const [activeLeagues, setActiveLeagues] = useState<any[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<any>(null);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [activeMatch, setActiveMatch] = useState<any>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const { data: leagues } = await supabase
        .from("leagues")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (leagues && leagues.length > 0) {
        setActiveLeagues(leagues);
        setSelectedLeague(leagues[0]);

        if (userId) {
          const leagueIds = leagues.map(l => l.id);
          const { data: openMatch } = await supabase.from("league_match_players")
            .select(`
              match_id, 
              league_matches!inner(id, table_name, is_closed, league_matchdays(title))
            `)
            .eq("player_id", userId)
            .eq("league_matches.is_closed", false)
            .in("league_matches.league_id", leagueIds)
            .limit(1)
            .single();

          if (openMatch) {
            setActiveMatch(openMatch.league_matches);
          }
        }
      }
      setLoadingInitial(false);
    };

    fetchInitialData();
  }, [supabase]);

  useEffect(() => {
    if (!selectedLeague) return;

    const fetchLeaderboard = async () => {
      setLoadingBoard(true);

      const { data: participants } = await supabase.from("league_participants")
        .select("player_id, league_players(profiles(nickname, avatar_config))")
        .eq("league_id", selectedLeague.id);

      const { data: matchPlayers } = await supabase.from("league_match_players")
        .select("player_id, match_id, league_matches!inner(league_id, is_closed)")
        .eq("league_matches.league_id", selectedLeague.id)
        .eq("league_matches.is_closed", true);

      const { data: scores } = await supabase.from("league_scores")
        .select("player_id, qty, league_achievements(description, points), league_matches!inner(league_id, is_closed)")
        .eq("league_matches.league_id", selectedLeague.id)
        .eq("league_matches.is_closed", true);

      if (participants) {
        const winKeywords = ["ganador", "gana", "victoria", "primer lugar", "1er lugar", "sobreviviente"];

        let calculatedBoard: LeaderboardPlayer[] = participants.map((p: any) => {
          const pMatches = matchPlayers?.filter(mp => mp.player_id === p.player_id) || [];
          const pScores = scores?.filter(s => s.player_id === p.player_id) || [];
          
          const totalPoints = pScores.reduce((acc, s: any) => acc + (s.qty * s.league_achievements.points), 0);
          
          const wins = pScores.filter((s: any) => 
            winKeywords.some(kw => s.league_achievements?.description.toLowerCase().includes(kw))
          ).reduce((acc, s: any) => acc + s.qty, 0);

          return {
            id: p.player_id,
            nickname: p.league_players?.profiles?.nickname || "Desconocido",
            avatar_config: p.league_players?.profiles?.avatar_config || {},
            points: totalPoints,
            matchesPlayed: pMatches.length,
            wins: wins
          };
        });

        // 1. Ordenamos por desempate en cascada
        calculatedBoard.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;             
          if (b.wins !== a.wins) return b.wins - a.wins;                     
          if (a.matchesPlayed !== b.matchesPlayed) return a.matchesPlayed - b.matchesPlayed; 
          return a.nickname.localeCompare(b.nickname);                       
        });
        
        // 2. Detección del "Empate Absoluto" para lanzar dados
        const finalBoard = calculatedBoard.map((p, i, arr) => {
          const prev = arr[i - 1];
          const next = arr[i + 1];
          
          const tiedWithPrev = prev && prev.points === p.points && prev.wins === p.wins && prev.matchesPlayed === p.matchesPlayed;
          const tiedWithNext = next && next.points === p.points && next.wins === p.wins && next.matchesPlayed === p.matchesPlayed;

          return {
            ...p,
            isAbsoluteTie: tiedWithPrev || tiedWithNext
          };
        });
        
        setLeaderboard(finalBoard);
      }
      setLoadingBoard(false);
    };

    fetchLeaderboard();
  }, [selectedLeague, supabase]);

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Calculando puntajes y desempates...</p>
      </div>
    );
  }

  if (activeLeagues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <Trophy className="w-16 h-16 text-amber-900/50 mb-6" />
        <h1 className={`text-2xl font-black tracking-widest uppercase text-[#8a7b6b] mb-4 ${cinzel.className}`}>Temporada Inactiva</h1>
        <p className="text-[#8a7b6b] text-sm max-w-md">No hay ninguna liga en curso en este momento. Los administradores deben crear e iniciar una nueva temporada.</p>
      </div>
    );
  }

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      
      {activeMatch && (
        <div className="mb-8 bg-gradient-to-r from-amber-900/40 to-amber-950/40 border border-amber-500/50 rounded-sm p-4 sm:p-6 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="bg-amber-500/20 p-3 rounded-full shrink-0">
              <Swords className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> ¡Te esperan en la mesa!
              </h3>
              <p className="text-[#e8e0d5] text-sm mt-1">
                {activeMatch.league_matchdays?.title} - <span className="font-bold">{activeMatch.table_name}</span>
              </p>
              <p className="text-[#8a7b6b] text-xs mt-1">Ingresa para reportar y auditar los puntos.</p>
            </div>
          </div>
          <Link href={`/league/matches/${activeMatch.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto !bg-amber-600 hover:!bg-amber-500 !text-white justify-center shadow-lg">
              Ir a la Sala <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-600 mb-2">Tabla de Posiciones</p>
          <h1 className={`text-3xl sm:text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 drop-shadow-md flex items-center justify-center sm:justify-start gap-3 ${cinzel.className}`}>
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 hidden sm:block" />
            {selectedLeague?.name}
          </h1>
        </div>

        {activeLeagues.length > 1 && (
          <div className="bg-black/60 border border-amber-900/30 p-2 rounded-sm w-full sm:w-64">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] mb-1 px-2">Cambiar Liga</label>
            <select 
              className="w-full bg-transparent text-amber-400 font-bold uppercase tracking-wider outline-none p-2 cursor-pointer text-sm"
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
      </header>

      <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-2xl overflow-hidden relative">
        
        {loadingBoard && (
          <div className="absolute inset-0 bg-[#0e0917]/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}

        <div className="hidden sm:grid grid-cols-12 gap-4 bg-black/60 p-4 border-b border-amber-900/30">
          <div className="col-span-1 text-center text-xs font-bold uppercase tracking-widest text-[#8a7b6b]">Pos</div>
          <div className="col-span-5 text-left text-xs font-bold uppercase tracking-widest text-[#8a7b6b]">Gladiador</div>
          <div className="col-span-2 text-center text-xs font-bold uppercase tracking-widest text-[#8a7b6b]">Partidas</div>
          <div className="col-span-2 text-center text-xs font-bold uppercase tracking-widest text-[#8a7b6b]">Victorias</div>
          <div className="col-span-2 text-right text-xs font-bold uppercase tracking-widest text-amber-500">Puntaje</div>
        </div>

        <div className="flex flex-col">
          {leaderboard.length === 0 ? (
            <div className="p-10 text-center text-[#8a7b6b] italic text-sm">
              La temporada acaba de comenzar. ¡Jueguen la primera fecha para ver los puntajes!
            </div>
          ) : (
            leaderboard.map((player, index) => {
              const isFirst = index === 0 && player.points > 0;
              const avg = player.matchesPlayed > 0 ? (player.points / player.matchesPlayed).toFixed(1) : "0";

              return (
                <div key={player.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 border-b border-white/5 items-center hover:bg-white/[0.02] transition-colors group">
                  
                  {/* MOBILE VIEW */}
                  <div className="flex items-center justify-between sm:hidden mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-sm font-black ${cinzel.className} ${isFirst ? 'bg-amber-500 text-black' : 'bg-black/60 text-[#8a7b6b]'}`}>
                        {index + 1}
                      </span>
                      {player.isAbsoluteTie && (
                        <div className="flex items-center gap-1 bg-cyan-950/50 px-2 py-1 rounded-sm border border-cyan-900/50">
                          <Dices className="w-3 h-3 text-cyan-400 animate-bounce" />
                          <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-widest">Empate</span>
                        </div>
                      )}
                      {isFirst && <Crown className="w-5 h-5 text-amber-500" />}
                    </div>
                    <span className={`text-2xl font-black ${cinzel.className} text-amber-400`}>
                      {player.points} pts
                    </span>
                  </div>

                  <div className="flex sm:hidden items-center gap-4">
                    <Link href={`/league/players/${player.id}`} className="shrink-0 w-12 h-12 bg-black/40 border border-amber-900/50 rounded-full flex items-center justify-center overflow-hidden">
                      <AvatarRenderer config={player.avatar_config} className="w-full h-full scale-110 translate-y-1" />
                    </Link>
                    <div className="flex flex-col">
                      <Link href={`/league/players/${player.id}`} className={`text-lg font-bold text-[#e8e0d5] hover:text-amber-400 transition-colors ${cinzel.className}`}>
                        {player.nickname}
                      </Link>
                      <span className="text-xs text-[#8a7b6b]">
                        {player.matchesPlayed} partidas | {player.wins} victorias
                      </span>
                    </div>
                  </div>

                  {/* DESKTOP VIEW */}
                  <div className="hidden sm:flex col-span-1 flex-col items-center justify-center gap-1">
                    <span className={`text-xl font-black ${cinzel.className} ${isFirst ? 'text-amber-500' : 'text-[#8a7b6b]'}`}>
                      #{index + 1}
                    </span>
                    {player.isAbsoluteTie && (
                      <span className="text-[8px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/50 border border-cyan-900/50 px-1 py-0.5 rounded-sm flex items-center gap-1" title="Empate absoluto. ¡Tiren los dados!">
                        <Dices className="w-2.5 h-2.5" /> Empate
                      </span>
                    )}
                  </div>
                  
                  <div className="hidden sm:flex col-span-5 items-center gap-4">
                    <Link href={`/league/players/${player.id}`} className="shrink-0 w-12 h-12 bg-black/40 border border-amber-900/50 rounded-full flex items-center justify-center overflow-hidden group-hover:border-amber-500 transition-colors">
                      <AvatarRenderer config={player.avatar_config} className="w-full h-full scale-110 translate-y-1" />
                    </Link>
                    <Link href={`/league/players/${player.id}`} className={`text-xl font-bold text-[#e8e0d5] group-hover:text-amber-400 transition-colors ${cinzel.className}`}>
                      {player.nickname}
                    </Link>
                    {isFirst && <Crown className="w-5 h-5 text-amber-500" />}
                  </div>
                  
                  <div className="hidden sm:flex col-span-2 flex-col items-center">
                    <span className="text-sm font-bold text-[#e8e0d5]">{player.matchesPlayed}</span>
                    <span className="text-[10px] uppercase text-[#8a7b6b]">Prom: {avg}</span>
                  </div>

                  <div className="hidden sm:flex col-span-2 flex-col items-center">
                    <span className="text-sm font-bold text-[#e8e0d5]">{player.wins}</span>
                    <span className="text-[10px] uppercase text-cyan-600 font-bold">Mesas Ganadas</span>
                  </div>
                  
                  <div className="hidden sm:flex col-span-2 justify-end items-center gap-2">
                    <span className={`text-3xl font-black ${cinzel.className} text-amber-400`}>
                      {player.points}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-600 mt-2">Pts</span>
                  </div>
                  
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}