"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Plus, ArrowLeft, Users, ScrollText, Calendar, Target, Dices, Loader2, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Cinzel } from "next/font/google";
import Link from "next/link";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface League { id: string; name: string; is_active: boolean; }
interface Player { id: string; profiles: { nickname: string } }
interface Achievement { id: string; description: string; points: number; is_random: boolean; }
interface Matchday { id: string; title: string; matchday_date: string; is_completed: boolean; }

type SubTab = "roster" | "rules" | "matchdays";

export default function AdminLeagues() {
  const supabase = createClient();
  
  // Estados de Vista General
  const [leagues, setLeagues] = useState<League[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // Estados de Vista Detallada
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [activeTab, setActiveTab] = useState<SubTab>("roster");
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Datos Globales vs Datos de la Liga
  const [globalPlayers, setGlobalPlayers] = useState<Player[]>([]);
  const [leaguePlayers, setLeaguePlayers] = useState<Set<string>>(new Set());
  
  const [globalAchs, setGlobalAchs] = useState<Achievement[]>([]);
  const [leagueAchs, setLeagueAchs] = useState<Set<string>>(new Set());

  const [matchdays, setMatchdays] = useState<Matchday[]>([]);
  const [newMatchdayTitle, setNewMatchdayTitle] = useState("");
  const [creatingMatchday, setCreatingMatchday] = useState(false);

  // 1. Cargar Ligas al montar
  useEffect(() => {
    const fetchLeagues = async () => {
      const { data } = await supabase.from("leagues").select("*").order("created_at", { ascending: false });
      if (data) setLeagues(data);
    };
    fetchLeagues();
  }, [supabase]);

  // 2. Cargar Detalles cuando se selecciona una liga
  useEffect(() => {
    if (!selectedLeague) return;
    const fetchDetails = async () => {
      setLoadingDetails(true);

      const { data: pData } = await supabase.from("league_players").select("id, profiles(nickname)").eq("status", "approved");
      if (pData) setGlobalPlayers(pData as unknown as Player[]);

      const { data: aData } = await supabase.from("league_achievements").select("*").eq("is_deprecated", false);
      if (aData) setGlobalAchs(aData);

      const { data: lpData } = await supabase.from("league_participants").select("player_id").eq("league_id", selectedLeague.id);
      if (lpData) setLeaguePlayers(new Set(lpData.map(lp => lp.player_id)));

      const { data: laData } = await supabase.from("league_achievement_map").select("achievement_id").eq("league_id", selectedLeague.id);
      if (laData) setLeagueAchs(new Set(laData.map(la => la.achievement_id)));

      const { data: mdData } = await supabase.from("league_matchdays").select("*").eq("league_id", selectedLeague.id).order("created_at", { ascending: true });
      if (mdData) setMatchdays(mdData);

      setLoadingDetails(false);
    };
    fetchDetails();
  }, [selectedLeague, supabase]);

  // Funciones de Vista General
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const isFirst = leagues.length === 0;
    const { data } = await supabase.from("leagues").insert({ name: name.trim(), is_active: isFirst }).select().single();
    if (data) { setLeagues([data, ...leagues]); setName(""); }
    setCreating(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!currentStatus) await supabase.from("leagues").update({ is_active: false }).neq("id", id);
    await supabase.from("leagues").update({ is_active: !currentStatus }).eq("id", id);
    setLeagues(prev => prev.map(l => ({ ...l, is_active: l.id === id ? !currentStatus : (currentStatus ? l.is_active : false) })));
  };

  const handleDeleteLeague = async (id: string) => {
    if (!window.confirm("🚨 ¿ESTÁS SEGURO? Se eliminará la liga completa, incluyendo todas sus fechas, mesas y puntajes. Esta acción es IRREVERSIBLE.")) return;
    const { error } = await supabase.from("leagues").delete().eq("id", id);
    if (!error) {
      setLeagues(prev => prev.filter(l => l.id !== id));
      if (selectedLeague?.id === id) setSelectedLeague(null);
    } else {
      alert("Error al eliminar la liga.");
    }
  };

  // Funciones de Vista Detallada (Toggles rápidos)
  const togglePlayerInLeague = async (playerId: string) => {
    if (!selectedLeague) return;
    const isIncluded = leaguePlayers.has(playerId);
    
    const newSet = new Set(leaguePlayers);
    if (isIncluded) newSet.delete(playerId); else newSet.add(playerId);
    setLeaguePlayers(newSet);

    if (isIncluded) {
      await supabase.from("league_participants").delete().match({ league_id: selectedLeague.id, player_id: playerId });
    } else {
      await supabase.from("league_participants").insert({ league_id: selectedLeague.id, player_id: playerId });
    }
  };

  const toggleAchievementInLeague = async (achId: string) => {
    if (!selectedLeague) return;
    const isIncluded = leagueAchs.has(achId);
    
    const newSet = new Set(leagueAchs);
    if (isIncluded) newSet.delete(achId); else newSet.add(achId);
    setLeagueAchs(newSet);

    if (isIncluded) {
      await supabase.from("league_achievement_map").delete().match({ league_id: selectedLeague.id, achievement_id: achId });
    } else {
      await supabase.from("league_achievement_map").insert({ league_id: selectedLeague.id, achievement_id: achId });
    }
  };

  const handleCreateMatchday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeague || !newMatchdayTitle.trim()) return;
    setCreatingMatchday(true);

    const { data } = await supabase.from("league_matchdays").insert({ league_id: selectedLeague.id, title: newMatchdayTitle.trim() }).select().single();
    if (data) { setMatchdays([...matchdays, data]); setNewMatchdayTitle(""); }
    setCreatingMatchday(false);
  };

  const handleDeleteMatchday = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta fecha? Se perderán todas las mesas y puntajes asociados a ella.")) return;
    const { error } = await supabase.from("league_matchdays").delete().eq("id", id);
    if (!error) {
      setMatchdays(prev => prev.filter(md => md.id !== id));
    } else {
      alert("Error al eliminar la fecha.");
    }
  };

  // ==========================================
  // RENDER: VISTA DETALLADA (Gestionar Liga)
  // ==========================================
  if (selectedLeague) {
    return (
      <section className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-amber-900/30 pb-4">
          <div>
            <button onClick={() => setSelectedLeague(null)} className="text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-400 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" /> Volver a Ligas
            </button>
            <h2 className={`text-2xl font-bold tracking-widest uppercase text-amber-500 flex items-center gap-2 ${cinzel.className}`}>
              <Trophy className="w-6 h-6" /> {selectedLeague.name}
            </h2>
          </div>
          
          <div className="flex bg-black/40 border border-amber-900/30 rounded-sm p-1">
            <button onClick={() => setActiveTab("roster")} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${activeTab === "roster" ? "bg-amber-900/40 text-amber-400" : "text-[#8a7b6b] hover:text-amber-500"}`}>
              <Users className="w-4 h-4 hidden sm:block" /> Roster
            </button>
            <button onClick={() => setActiveTab("rules")} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${activeTab === "rules" ? "bg-amber-900/40 text-amber-400" : "text-[#8a7b6b] hover:text-amber-500"}`}>
              <ScrollText className="w-4 h-4 hidden sm:block" /> Reglas
            </button>
            <button onClick={() => setActiveTab("matchdays")} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-2 ${activeTab === "matchdays" ? "bg-amber-900/40 text-amber-400" : "text-[#8a7b6b] hover:text-amber-500"}`}>
              <Calendar className="w-4 h-4 hidden sm:block" /> Fechas
            </button>
          </div>
        </div>

        {loadingDetails ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-4" />
            <p className="text-[#8a7b6b] uppercase tracking-widest text-xs font-bold">Cargando base de datos del torneo...</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {activeTab === "roster" && (
              <div className="space-y-4">
                <p className="text-sm text-[#8a7b6b] mb-4">Selecciona los jugadores autorizados que participarán en esta liga específica.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {globalPlayers.map(p => (
                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${leaguePlayers.has(p.id) ? "bg-amber-950/30 border-amber-500/50" : "bg-black/40 border-amber-900/20 hover:border-amber-700/50"}`}>
                      <input type="checkbox" checked={leaguePlayers.has(p.id)} onChange={() => togglePlayerInLeague(p.id)} className="w-4 h-4 accent-amber-600" />
                      <span className={`text-sm font-bold text-[#e8e0d5] ${cinzel.className}`}>{p.profiles?.nickname}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "rules" && (
              <div className="space-y-4">
                <p className="text-sm text-[#8a7b6b] mb-4">Selecciona qué logros del catálogo global estarán vigentes durante esta temporada.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {globalAchs.map(ach => (
                    <label key={ach.id} className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${leagueAchs.has(ach.id) ? "bg-amber-950/30 border-amber-500/50" : "bg-black/40 border-amber-900/20 hover:border-amber-700/50"}`}>
                      <input type="checkbox" checked={leagueAchs.has(ach.id)} onChange={() => toggleAchievementInLeague(ach.id)} className="w-4 h-4 mt-1 accent-amber-600" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          {ach.is_random ? <span className="text-[10px] text-cyan-500 flex gap-1 items-center"><Dices className="w-3 h-3"/> Al Azar</span> : <span className="text-[10px] text-amber-500 flex gap-1 items-center"><Target className="w-3 h-3"/> Fijo</span>}
                          <span className={`font-black ${ach.points > 0 ? "text-green-500" : "text-red-500"}`}>{ach.points > 0 ? `+${ach.points}` : ach.points}</span>
                        </div>
                        <p className="text-xs text-[#e8e0d5]">{ach.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "matchdays" && (
              <div className="space-y-8">
                <form onSubmit={handleCreateMatchday} className="flex gap-3 items-end bg-black/40 p-4 border border-amber-900/20 rounded-sm">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8a7b6b] mb-1">Nueva Fecha</label>
                    <Input value={newMatchdayTitle} onChange={e => setNewMatchdayTitle(e.target.value)} placeholder="Ej. Fecha 1, Semifinales, etc." required className="!border-amber-900/30 text-sm" />
                  </div>
                  <Button type="submit" isLoading={creatingMatchday} className="!bg-amber-700 !text-white h-10"><Plus className="w-4 h-4"/> Crear</Button>
                </form>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4">Calendario de la Liga</h3>
                  {matchdays.length === 0 ? (
                    <p className="text-sm text-[#8a7b6b] italic">Aún no hay fechas programadas.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {matchdays.map(md => (
                        <div key={md.id} className="p-4 bg-black/40 border border-amber-900/30 rounded-sm flex items-center justify-between group">
                          <div>
                            <h4 className={`text-lg font-bold text-amber-400 ${cinzel.className}`}>{md.title}</h4>
                            <p className="text-xs text-[#8a7b6b]">Creada el {new Date(md.matchday_date).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/league/admin/matchdays/${md.id}`}>
                              <Button className="!bg-amber-900/30 !border-amber-700/50 hover:!bg-amber-800/50 !text-amber-400">
                                Armar Mesas &gt;
                              </Button>
                            </Link>
                            <button onClick={() => handleDeleteMatchday(md.id)} className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-950/40 rounded-sm transition-colors" title="Eliminar Fecha">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // ==========================================
  // RENDER: VISTA GENERAL (Lista de Ligas)
  // ==========================================
  return (
    <section className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-4">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h2 className={`text-xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>Ligas y Temporadas</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-black/40 border border-amber-900/20 p-5 rounded-sm h-fit">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Liga</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Liga Commander 2026" required className="!border-amber-900/30 text-sm" />
            <Button type="submit" isLoading={creating} className="w-full justify-center !bg-gradient-to-b !from-amber-600 !to-amber-900 !text-white">Crear Temporada</Button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {leagues.length === 0 ? (
             <p className="text-sm text-[#8a7b6b] italic">No has creado ninguna liga aún.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {leagues.map((league) => (
                <div key={league.id} className={`p-4 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${league.is_active ? "bg-amber-950/20 border-amber-500/50" : "bg-black/40 border-amber-900/20 opacity-70"}`}>
                  <div>
                    <h4 className={`text-lg font-bold ${league.is_active ? "text-amber-400" : "text-[#8a7b6b]"} ${cinzel.className}`}>{league.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-[#8a7b6b]">{league.is_active ? "Temporada en curso" : "Temporada archivada"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => toggleActive(league.id, league.is_active)} className={`!px-3 !py-2 text-xs ${league.is_active ? "!bg-green-900/30 !text-green-500 !border-green-900/50" : "!bg-transparent !text-[#8a7b6b] hover:!text-amber-500"}`}>
                      {league.is_active ? "Activa" : "Activar"}
                    </Button>
                    <Button onClick={() => setSelectedLeague(league)} className="!px-3 !py-2 text-xs !bg-amber-900/50 !text-amber-400 hover:!bg-amber-800">
                      Gestionar
                    </Button>
                    <button onClick={() => handleDeleteLeague(league.id)} className="p-2 text-red-500/50 hover:text-red-400 hover:bg-red-950/40 rounded-sm transition-colors" title="Eliminar Liga">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}