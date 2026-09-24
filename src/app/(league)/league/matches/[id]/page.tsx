"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, ArrowLeft, ShieldAlert, Swords, CheckCircle2, Lock, Plus, Minus, UserCheck } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface Score { id?: string; match_id: string; player_id: string; achievement_id: string; qty: number; }
interface MatchPlayer { player_id: string; has_confirmed: boolean; nickname: string; }
interface Achievement { id: string; description: string; points: number; is_random: boolean; }

export default function MatchReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadMatchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setAccessDenied(true); setLoading(false); return; }
      
      const userId = session.user.id;
      setCurrentUser(userId);

      // 1. Obtener perfil para saber si es Admin
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).single();
      const userIsAdmin = profile?.is_admin || false;
      setIsAdmin(userIsAdmin);

      // 2. Traer la mesa, sus jugadores y los dados tirados
      const { data: matchData } = await supabase.from("league_matches").select(`
        id, table_name, is_closed, league_id,
        league_matchdays(title),
        league_match_players (player_id, has_confirmed, league_players(profiles(nickname))),
        league_match_randoms (league_achievements(id, description, points, is_random))
      `).eq("id", matchId).single();

      if (!matchData) { setAccessDenied(true); setLoading(false); return; }
      setMatch(matchData);

      const matchPlayers: MatchPlayer[] = matchData.league_match_players.map((mp: any) => ({
        player_id: mp.player_id,
        has_confirmed: mp.has_confirmed,
        nickname: mp.league_players.profiles.nickname
      }));
      setPlayers(matchPlayers);

      // REGLA DE SEGURIDAD VISUAL: Si no está cerrada y no estoy en la mesa, bloqueado (salvo que sea admin).
      const isPlayerInTable = matchPlayers.some(p => p.player_id === userId);
      if (!matchData.is_closed && !isPlayerInTable && !userIsAdmin) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // 3. Traer Logros Fijos de esta Liga
      const { data: fixedMap } = await supabase.from("league_achievement_map")
        .select("league_achievements(id, description, points, is_random)")
        .eq("league_id", matchData.league_id);
      
      let allAchs: Achievement[] = [];
      
      if (fixedMap) {
        const fixed = fixedMap.map((fm: any) => fm.league_achievements).filter((a: any) => !a.is_random);
        allAchs = [...fixed];
      }

      // Añadir los Logros Aleatorios que salieron en los dados de esta mesa
      if (matchData.league_match_randoms) {
        const randoms = matchData.league_match_randoms.map((mr: any) => mr.league_achievements);
        allAchs = [...allAchs, ...randoms];
      }
      setAchievements(allAchs);

      // 4. Traer los puntajes actuales anotados en esta mesa
      const { data: scoresData } = await supabase.from("league_scores").select("*").eq("match_id", matchId);
      if (scoresData) setScores(scoresData);

      setLoading(false);
    };

    loadMatchData();
  }, [matchId, supabase]);

  // Manejar el (+ / -) de los puntos
  const handleScoreChange = async (playerId: string, achievementId: string, delta: number) => {
    // Si la mesa está cerrada, o el jugador actual ya confirmó su resultado, no puede editar
    const myPlayer = players.find(p => p.player_id === currentUser);
    if (match.is_closed || (myPlayer && myPlayer.has_confirmed)) return;

    setProcessing(true);
    const existingScore = scores.find(s => s.player_id === playerId && s.achievement_id === achievementId);
    
    let newQty = existingScore ? existingScore.qty + delta : delta;
    if (newQty < 0) newQty = 0; // No pueden haber logros "negativos en cantidad"

    if (existingScore) {
      if (newQty === 0) {
        await supabase.from("league_scores").delete().eq("id", existingScore.id);
        setScores(scores.filter(s => s.id !== existingScore.id));
      } else {
        await supabase.from("league_scores").update({ qty: newQty }).eq("id", existingScore.id);
        setScores(scores.map(s => s.id === existingScore.id ? { ...s, qty: newQty } : s));
      }
    } else if (newQty > 0) {
      const { data } = await supabase.from("league_scores")
        .insert({ match_id: matchId, player_id: playerId, achievement_id: achievementId, qty: newQty })
        .select().single();
      if (data) setScores([...scores, data]);
    }
    setProcessing(false);
  };

  const handleConfirm = async () => {
    if (!window.confirm("¿Estás seguro de confirmar? Ya no podrás editar puntos hasta que un admin reabra la mesa.")) return;
    setProcessing(true);

    // 1. Confirmo mi estado
    await supabase.from("league_match_players").update({ has_confirmed: true }).match({ match_id: matchId, player_id: currentUser });
    
    const updatedPlayers = players.map(p => p.player_id === currentUser ? { ...p, has_confirmed: true } : p);
    setPlayers(updatedPlayers);

    // 2. Verificamos si TODOS han confirmado para cerrar la mesa
    const allConfirmed = updatedPlayers.every(p => p.has_confirmed);
    if (allConfirmed) {
      await supabase.from("league_matches").update({ is_closed: true }).eq("id", matchId);
      setMatch({ ...match, is_closed: true });
    }
    
    setProcessing(false);
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Cargando mesa...</p>
      </main>
    );
  }

  if (accessDenied) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-600/80 mb-6" />
        <h1 className={`text-3xl font-black tracking-widest uppercase text-red-500 mb-4 ${cinzel.className}`}>Mesa en Progreso</h1>
        <p className="text-[#8a7b6b] max-w-md mx-auto text-sm">No estás participando en esta mesa. Podrás ver los resultados cuando todos los jugadores confirmen sus puntuaciones.</p>
        <Link href="/league" className="mt-8">
          <Button className="!bg-amber-900/30 !text-amber-500">Volver a la Liga</Button>
        </Link>
      </main>
    );
  }

  const myPlayer = players.find(p => p.player_id === currentUser);
  const isLockedForMe = match.is_closed || (myPlayer?.has_confirmed);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8 border-b border-amber-900/30 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {isAdmin && (
             <Link href={`/league/admin/matchdays/${match.league_matchdays?.id}`} className="text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-400 flex items-center gap-1 mb-2">
               <ArrowLeft className="w-4 h-4" /> Volver a Admin de Fecha
             </Link>
          )}
          <h1 className={`text-3xl md:text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 drop-shadow-md flex items-center gap-3 ${cinzel.className}`}>
            <Swords className="w-8 h-8 text-amber-500" />
            {match.league_matchdays?.title} - {match.table_name}
          </h1>
        </div>
        
        <div className={`px-4 py-2 rounded-sm border font-bold uppercase tracking-widest text-xs flex items-center gap-2 ${match.is_closed ? "bg-green-950/40 border-green-900/50 text-green-500" : "bg-cyan-950/40 border-cyan-900/50 text-cyan-500"}`}>
          {match.is_closed ? <><Lock className="w-4 h-4"/> Resultados Finales</> : <><Loader2 className="w-4 h-4 animate-spin"/> Mesa en Progreso</>}
        </div>
      </header>

      {/* Grid de Jugadores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {players.map(player => (
          <div key={player.player_id} className={`bg-[#0e0917] border rounded-sm p-5 shadow-xl relative transition-colors ${player.has_confirmed ? "border-green-900/50" : "border-amber-900/30"}`}>
            
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <h2 className={`text-xl font-bold uppercase text-[#e8e0d5] flex items-center gap-2 ${cinzel.className}`}>
                <UserCheck className={`w-5 h-5 ${player.has_confirmed ? "text-green-500" : "text-[#8a7b6b]"}`} />
                {player.nickname}
              </h2>
              {player.has_confirmed ? (
                <span className="text-[10px] uppercase font-bold text-green-500 bg-green-950/40 px-2 py-1 rounded-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Confirmado
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold text-amber-500/50 bg-amber-950/20 px-2 py-1 rounded-sm">
                  Reportando...
                </span>
              )}
            </div>

            {/* Lista de Logros para este jugador */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {achievements.map(ach => {
                const pScore = scores.find(s => s.player_id === player.player_id && s.achievement_id === ach.id);
                const qty = pScore ? pScore.qty : 0;
                
                return (
                  <div key={ach.id} className={`p-3 rounded-sm border flex items-center justify-between gap-3 ${qty > 0 ? (ach.points > 0 ? "bg-green-950/10 border-green-900/30" : "bg-red-950/10 border-red-900/30") : "bg-black/40 border-white/5"}`}>
                    <div className="flex-1">
                      <p className="text-xs text-[#e8e0d5] leading-tight mb-1">{ach.description}</p>
                      <span className={`text-[10px] font-black uppercase ${ach.points > 0 ? "text-green-500" : "text-red-500"}`}>
                        {ach.points > 0 ? `+${ach.points}` : ach.points} {ach.points === 1 || ach.points === -1 ? 'pto' : 'ptos'} c/u
                      </span>
                    </div>

                    {/* Controles + / - */}
                    <div className="flex items-center gap-3 bg-black/60 rounded-sm border border-white/5 p-1">
                      <button 
                        onClick={() => handleScoreChange(player.player_id, ach.id, -1)}
                        disabled={isLockedForMe || qty === 0 || processing}
                        className="w-6 h-6 flex items-center justify-center text-[#8a7b6b] hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`text-sm font-bold w-4 text-center ${qty > 0 ? "text-amber-400" : "text-[#8a7b6b]"}`}>
                        {qty}
                      </span>
                      <button 
                        onClick={() => handleScoreChange(player.player_id, ach.id, 1)}
                        disabled={isLockedForMe || processing}
                        className="w-6 h-6 flex items-center justify-center text-[#8a7b6b] hover:text-green-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Total parcial del jugador */}
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#8a7b6b] tracking-widest">Puntos en esta mesa</span>
              <span className={`text-xl font-black ${cinzel.className} text-amber-500`}>
                {scores.filter(s => s.player_id === player.player_id).reduce((acc, s) => {
                  const a = achievements.find(ach => ach.id === s.achievement_id);
                  return acc + (a ? a.points * s.qty : 0);
                }, 0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Zona de Acción del Jugador Actual */}
      {!match.is_closed && myPlayer && !myPlayer.has_confirmed && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050308]/90 backdrop-blur-md border-t border-amber-900/50 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500">Es tu turno de auditar</h3>
              <p className="text-xs text-[#8a7b6b]">Anota tus logros y los de tus oponentes. Al confirmar, tus votos se bloquean.</p>
            </div>
            <Button 
              onClick={handleConfirm} 
              isLoading={processing}
              className="w-full sm:w-auto !bg-gradient-to-r !from-green-600 !to-green-900 !text-white !px-8"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar Resultados
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}