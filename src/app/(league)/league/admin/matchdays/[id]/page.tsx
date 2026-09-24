"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, ArrowLeft, Users, Dices, Swords, RotateCcw, ClipboardSignature, Unlock, Layers } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { buildEDHTables, rollTableAchievements, MatchmakingPlayer, Achievement } from "@/lib/league/matchmaking";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function MatchdayManagerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchdayId = resolvedParams.id;
  
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [matchday, setMatchday] = useState<any>(null);
  
  const [leaguePlayers, setLeaguePlayers] = useState<MatchmakingPlayer[]>([]);
  const [randomPool, setRandomPool] = useState<Achievement[]>([]);
  const [attendance, setAttendance] = useState<Set<string>>(new Set());
  
  const [generating, setGenerating] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<any[]>([]);
  const [roundToGenerate, setRoundToGenerate] = useState(1);

  useEffect(() => {
    const loadMatchdayData = async () => {
      const { data: mdData } = await supabase.from("league_matchdays").select("*").eq("id", matchdayId).single();
      if (!mdData) return;
      setMatchday(mdData);

      // Traemos las mesas e incluimos la columna round_number
      const { data: existingMatches } = await supabase.from("league_matches").select(`
        id, table_name, is_closed, round_number,
        league_match_players ( player_id, league_players(profiles(nickname)) ),
        league_match_randoms ( league_achievements(description, points) )
      `).eq("matchday_id", matchdayId).order("round_number", { ascending: true }).order("table_name", { ascending: true });

      if (existingMatches && existingMatches.length > 0) {
        setGeneratedMatches(existingMatches);
        // Autocalcular la siguiente ronda a generar
        const maxRound = existingMatches.reduce((max, m) => Math.max(max, m.round_number || 1), 0);
        setRoundToGenerate(maxRound + 1);
      }

      const { data: parts } = await supabase.from("league_participants").select(`
        player_id,
        league_players ( profiles(nickname) )
      `).eq("league_id", mdData.league_id);

      if (parts) {
        const parsedPlayers = parts.map((p: any) => ({
          id: p.player_id,
          nickname: p.league_players.profiles.nickname,
          score: 0 // En una v2, aquí calcularemos los puntos reales para el matchmaking suizo
        }));
        setLeaguePlayers(parsedPlayers);
        
        // Si hay mesas, marcar como asistentes solo a los que jugaron la última ronda para facilitar
        if (existingMatches && existingMatches.length > 0) {
          const maxRound = existingMatches.reduce((max, m) => Math.max(max, m.round_number || 1), 0);
          const lastRoundMatches = existingMatches.filter(m => (m.round_number || 1) === maxRound);
          const presentIds = new Set<string>();
          lastRoundMatches.forEach(m => m.league_match_players.forEach((mp: any) => presentIds.add(mp.player_id)));
          setAttendance(presentIds);
        } else {
          setAttendance(new Set(parsedPlayers.map(p => p.id)));
        }
      }

      const { data: aMap } = await supabase.from("league_achievement_map").select(`
        league_achievements (id, description, points, is_random)
      `).eq("league_id", mdData.league_id);

      if (aMap) {
        const pool = aMap.map((a: any) => a.league_achievements).filter((a: any) => a.is_random);
        setRandomPool(pool);
      }

      setLoading(false);
    };

    loadMatchdayData();
  }, [matchdayId, supabase]);

  const toggleAttendance = (id: string) => {
    const newSet = new Set(attendance);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setAttendance(newSet);
  };

  const handleGenerateMatchmaking = async () => {
    if (attendance.size < 2) return alert("Se necesitan al menos 2 jugadores.");
    setGenerating(true);

    const presentPlayers = leaguePlayers.filter(p => attendance.has(p.id));
    const tables = buildEDHTables(presentPlayers);

    for (let i = 0; i < tables.length; i++) {
      const tablePlayers = tables[i];
      const tableName = `Mesa ${i + 1}`;

      const { data: matchData, error: matchErr } = await supabase.from("league_matches").insert({
        league_id: matchday.league_id,
        matchday_id: matchday.id,
        table_name: tableName,
        round_number: roundToGenerate // Guardamos el número de ronda
      }).select().single();

      if (matchErr || !matchData) {
        console.error("Error creando mesa", matchErr);
        continue;
      }

      const matchPlayersInserts = tablePlayers.map(p => ({ match_id: matchData.id, player_id: p.id }));
      await supabase.from("league_match_players").insert(matchPlayersInserts);
      
      const rolledAchievements = rollTableAchievements(randomPool, 6);
      if (rolledAchievements.length > 0) {
        const randomsInserts = rolledAchievements.map(a => ({ match_id: matchData.id, achievement_id: a.id }));
        await supabase.from("league_match_randoms").insert(randomsInserts);
      }
    }

    window.location.reload();
  };

  const handleResetRound = async (roundNum: number) => {
    if (!window.confirm(`¿Seguro que deseas desarmar TODA la Ronda ${roundNum}? Se perderán los puntos anotados en ella.`)) return;
    setGenerating(true);
    
    // Solo borramos las mesas de la ronda específica
    const { error } = await supabase.from("league_matches")
      .delete()
      .eq("matchday_id", matchdayId)
      .eq("round_number", roundNum);
      
    if (!error) {
      window.location.reload();
    } else {
      alert("Error al desarmar las mesas.");
      setGenerating(false);
    }
  };

  const handleReopenMatch = async (matchId: string) => {
    if (!window.confirm("¿Seguro que deseas reabrir esta mesa? Los jugadores perderán su confirmación.")) return;
    setGenerating(true);
    await supabase.from("league_matches").update({ is_closed: false }).eq("id", matchId);
    await supabase.from("league_match_players").update({ has_confirmed: false }).eq("match_id", matchId);
    window.location.reload();
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Preparando arena...</p>
      </main>
    );
  }

  // Agrupar mesas generadas por número de ronda
  const matchesByRound = generatedMatches.reduce((acc, match) => {
    const r = match.round_number || 1;
    if (!acc[r]) acc[r] = [];
    acc[r].push(match);
    return acc;
  }, {} as Record<number, any[]>);

  const roundNumbers = Object.keys(matchesByRound).map(Number).sort((a, b) => b - a); // Orden descendente (más nueva arriba)

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8 border-b border-amber-900/30 pb-6 flex items-start justify-between">
        <div>
          <Link href="/league/admin/leagues" className="text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-400 flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Volver a la Liga
          </Link>
          <h1 className={`text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 drop-shadow-md flex items-center gap-3 ${cinzel.className}`}>
            {matchday?.title}
          </h1>
          <p className="text-[#a39481] mt-2 text-sm">El sistema multirronda te permite jugar varias veces en la misma fecha.</p>
        </div>
      </header>

      {/* BLOQUE DE ASISTENCIA Y GENERACIÓN (Siempre visible ahora) */}
      <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-6 mb-10 relative">
        {generating && (
          <div className="absolute inset-0 bg-[#0e0917]/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-amber-900/30 pb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className={`text-xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>
                Lista de Asistencia ({attendance.size}/{leaguePlayers.length})
              </h2>
              <p className="text-xs text-[#8a7b6b] mt-1">Selecciona quiénes siguen presentes para generar la próxima ronda.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-black/40 border border-amber-900/30 p-2 rounded-sm">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] ml-1">Generando</label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-500 pl-1">Ronda</span>
                <input 
                  type="number" 
                  min="1" 
                  value={roundToGenerate} 
                  onChange={(e) => setRoundToGenerate(Number(e.target.value))}
                  className="w-12 bg-transparent text-white font-bold border-b border-amber-900 focus:border-amber-500 outline-none text-center"
                />
              </div>
            </div>
            <Button onClick={handleGenerateMatchmaking} className="!bg-gradient-to-b !from-amber-600 !to-amber-900 !text-white !px-6">
              Lanzar Dados
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {leaguePlayers.map(p => (
            <div 
              key={p.id}
              onClick={() => toggleAttendance(p.id)}
              className={`p-3 rounded-sm border cursor-pointer transition-all text-center select-none ${attendance.has(p.id) ? "bg-amber-950/40 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-black/60 border-[#1c1611] opacity-50 hover:opacity-100"}`}
            >
              <div className={`w-3 h-3 mx-auto rounded-full mb-2 ${attendance.has(p.id) ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-red-900"}`}></div>
              <p className={`text-sm font-bold text-[#e8e0d5] ${cinzel.className} truncate`}>{p.nickname}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BLOQUE DE RONDAS GENERADAS */}
      {roundNumbers.length > 0 && (
        <div className="space-y-10">
          {roundNumbers.map(roundNum => (
            <div key={roundNum} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/30 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-6 h-6 text-cyan-500" />
                  <h2 className={`text-xl font-bold uppercase tracking-widest text-[#e8e0d5] ${cinzel.className}`}>
                    Ronda {roundNum}
                  </h2>
                </div>
                <Button onClick={() => handleResetRound(roundNum)} disabled={generating} className="!bg-red-950/30 !border-red-900/50 hover:!bg-red-900/40 !text-red-400 !px-4 !py-1.5 text-xs">
                  <RotateCcw className="w-3 h-3 mr-2" /> Desarmar Ronda {roundNum}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matchesByRound[roundNum].map((mesa: any) => (
                  <div key={mesa.id} className="bg-[#0e0917] border border-amber-900/30 rounded-sm p-5 shadow-lg relative flex flex-col">
                    <div className="absolute top-0 right-0 bg-amber-900/30 px-3 py-1 text-[10px] font-bold uppercase text-amber-500 rounded-bl-sm flex items-center gap-2">
                      {mesa.is_closed && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Mesa Cerrada"></span>}
                      {mesa.table_name}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] mb-3 mt-2 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Gladiadores
                      </h3>
                      <ul className="space-y-1 mb-6 border-b border-amber-900/20 pb-4">
                        {mesa.league_match_players?.map((mp: any) => (
                          <li key={mp.player_id} className={`text-sm font-bold text-[#e8e0d5] ${cinzel.className}`}>
                            • {mp.league_players?.profiles?.nickname || "Jugador Desconocido"}
                          </li>
                        ))}
                      </ul>

                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] mb-3 flex items-center gap-2">
                        <Dices className="w-4 h-4 text-cyan-500" /> Dados Tirados
                      </h3>
                      <ul className="space-y-2">
                        {mesa.league_match_randoms.map((mr: any, idx: number) => (
                          <li key={idx} className="text-xs text-[#e8e0d5] flex items-start gap-2 leading-tight">
                            <span className={`text-green-400 font-black shrink-0`}>+{mr.league_achievements.points}</span>
                            <span>{mr.league_achievements.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-4 border-t border-amber-900/20 flex flex-col gap-2">
                      <Link href={`/league/matches/${mesa.id}`}>
                        <Button className="w-full justify-center !bg-amber-900/20 !border-amber-700/50 hover:!bg-amber-800/40 !text-amber-400">
                          <ClipboardSignature className="w-4 h-4 mr-2" /> Sala de Reporte
                        </Button>
                      </Link>
                      {mesa.is_closed && (
                        <Button onClick={() => handleReopenMatch(mesa.id)} disabled={generating} className="w-full justify-center !bg-red-950/20 !border-red-900/30 hover:!bg-red-900/40 !text-red-400">
                          <Unlock className="w-4 h-4 mr-2" /> Forzar Reapertura
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}