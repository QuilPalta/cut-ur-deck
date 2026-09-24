"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, ArrowLeft, Users, Dices, Swords, RotateCcw, ClipboardSignature } from "lucide-react";
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

  useEffect(() => {
    const loadMatchdayData = async () => {
      const { data: mdData } = await supabase.from("league_matchdays").select("*").eq("id", matchdayId).single();
      if (!mdData) return;
      setMatchday(mdData);

      // Traer mesas existentes
      const { data: existingMatches } = await supabase.from("league_matches").select(`
        id, table_name, is_closed,
        league_match_players ( player_id, league_players(profiles(nickname)) ),
        league_match_randoms ( league_achievements(description, points) )
      `).eq("matchday_id", matchdayId).order("table_name", { ascending: true });

      if (existingMatches && existingMatches.length > 0) {
        setGeneratedMatches(existingMatches);
        setLoading(false);
        return;
      }

      // Si no hay mesas, cargar participantes para la asistencia
      const { data: parts } = await supabase.from("league_participants").select(`
        player_id,
        league_players ( profiles(nickname) )
      `).eq("league_id", mdData.league_id);

      if (parts) {
        const parsedPlayers = parts.map((p: any) => ({
          id: p.player_id,
          nickname: p.league_players.profiles.nickname,
          score: 0 
        }));
        setLeaguePlayers(parsedPlayers);
        setAttendance(new Set(parsedPlayers.map(p => p.id)));
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
        table_name: tableName
      }).select().single();

      if (matchErr || !matchData) {
        console.error("Error creando mesa", matchErr);
        continue;
      }

      const matchPlayersInserts = tablePlayers.map(p => ({ match_id: matchData.id, player_id: p.id }));
      const { error: playersErr } = await supabase.from("league_match_players").insert(matchPlayersInserts);
      
      if (playersErr) {
        console.error("Error insertando jugadores", playersErr);
        alert("Ocurrió un error al asignar los jugadores. Usa el botón 'Desarmar Mesas' y vuelve a intentar.");
      }

      const rolledAchievements = rollTableAchievements(randomPool, 6);
      if (rolledAchievements.length > 0) {
        const randomsInserts = rolledAchievements.map(a => ({ match_id: matchData.id, achievement_id: a.id }));
        await supabase.from("league_match_randoms").insert(randomsInserts);
      }
    }

    window.location.reload();
  };

  // Novedad: Botón para desarmar mesas y reiniciar
  const handleResetMatches = async () => {
    if (!window.confirm("¿Seguro que deseas desarmar todas las mesas de esta fecha? Se perderán si ya había puntos anotados.")) return;
    setGenerating(true);
    // Borrar en cascada
    const { error } = await supabase.from("league_matches").delete().eq("matchday_id", matchdayId);
    if (!error) {
      window.location.reload();
    } else {
      alert("Error al desarmar las mesas.");
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Preparando arena...</p>
      </main>
    );
  }

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
          <p className="text-[#a39481] mt-2 text-sm">Gestiona la asistencia y genera las mesas oficiales de la fecha.</p>
        </div>
      </header>

      {generatedMatches.length > 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Swords className="w-6 h-6 text-green-500" />
              <h2 className={`text-xl font-bold uppercase tracking-widest text-[#e8e0d5] ${cinzel.className}`}>Mesas Activas</h2>
            </div>
            {/* NUEVO BOTÓN: Desarmar Mesas */}
            <Button onClick={handleResetMatches} isLoading={generating} className="!bg-red-950/30 !border-red-900/50 hover:!bg-red-900/40 !text-red-400 !px-4 !py-2 text-xs">
              <RotateCcw className="w-3 h-3 mr-2" /> Desarmar y Volver a Generar
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedMatches.map((mesa: any) => (
              <div key={mesa.id} className="bg-[#0e0917] border border-amber-900/30 rounded-sm p-5 shadow-lg relative flex flex-col">
                <div className="absolute top-0 right-0 bg-amber-900/30 px-3 py-1 text-[10px] font-bold uppercase text-amber-500 rounded-bl-sm">
                  {mesa.table_name}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] mb-3 mt-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Gladiadores
                  </h3>
                  <ul className="space-y-1 mb-6 border-b border-amber-900/20 pb-4">
                    {mesa.league_match_players?.length > 0 ? (
                      mesa.league_match_players.map((mp: any) => (
                        <li key={mp.player_id} className={`text-sm font-bold text-[#e8e0d5] ${cinzel.className}`}>
                          • {mp.league_players?.profiles?.nickname || "Jugador Desconocido"}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs italic text-red-500">Error: Jugadores no asignados. Por favor desarma la mesa.</li>
                    )}
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

                {/* NUEVO BOTÓN: Auto-Reporte */}
                <div className="pt-6 mt-4 border-t border-amber-900/20">
                  <Link href={`/league/matches/${mesa.id}`}>
                    <Button className="w-full justify-center !bg-amber-900/20 !border-amber-700/50 hover:!bg-amber-800/40 !text-amber-400">
                      <ClipboardSignature className="w-4 h-4 mr-2" /> Sala de Reporte de Puntos
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-amber-900/30 pb-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-500" />
              <h2 className={`text-xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>
                Lista de Asistencia ({attendance.size}/{leaguePlayers.length})
              </h2>
            </div>
            <Button onClick={handleGenerateMatchmaking} isLoading={generating} className="!bg-gradient-to-b !from-amber-600 !to-amber-900 !text-white !px-6">
              Generar Mesas
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {leaguePlayers.map(p => (
              <div 
                key={p.id}
                onClick={() => toggleAttendance(p.id)}
                className={`p-3 rounded-sm border cursor-pointer transition-all text-center select-none ${attendance.has(p.id) ? "bg-amber-950/40 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-black/60 border-[#1c1611] opacity-50 hover:opacity-100"}`}
              >
                <div className={`w-3 h-3 mx-auto rounded-full mb-2 ${attendance.has(p.id) ? "bg-green-500 shadow-[0_0_5px_#22c55e]" : "bg-red-900"}`}></div>
                <p className={`text-sm font-bold text-[#e8e0d5] ${cinzel.className}`}>{p.nickname}</p>
                <p className="text-[10px] uppercase text-[#8a7b6b] mt-1">{p.score} pts</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}