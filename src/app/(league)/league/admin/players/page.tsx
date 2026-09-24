"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Users, UserPlus, UserCheck, ShieldBan } from "lucide-react";
import Button from "@/components/ui/Button";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface Player {
  id: string;
  status: string;
  profiles: { nickname: string };
}

export default function AdminRequests() {
  const supabase = createClient();
  const [players, setPlayers] = useState<Player[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      // Traemos tanto a los pendientes como a los aprobados
      const { data } = await supabase
        .from("league_players")
        .select("id, status, profiles(nickname)")
        .in("status", ["pending", "approved"]);
        
      if (data) setPlayers(data as unknown as Player[]);
    };
    fetchPlayers();
  }, [supabase]);

  const handleResolution = async (playerId: string, newStatus: "approved" | "rejected" | "banned") => {
    if (newStatus === "banned" || newStatus === "rejected") {
      if (!window.confirm("¿Estás seguro de que deseas revocar el acceso a este jugador?")) return;
    }

    setProcessingId(playerId);
    const { error } = await supabase.from("league_players").update({ status: newStatus }).eq("id", playerId);
    
    if (!error) {
      if (newStatus === "approved") {
        // Si lo aprobamos, simplemente le cambiamos el estado en la interfaz para que pase a la otra lista
        setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, status: "approved" } : p));
      } else {
        // Si lo rechazamos o baneamos, lo sacamos de la vista
        setPlayers(prev => prev.filter(p => p.id !== playerId));
      }
    } else {
      alert("Error al actualizar el estado del jugador.");
    }
    
    setProcessingId(null);
  };

  // Filtramos las dos listas para renderizarlas por separado
  const pendingRequests = players.filter(p => p.status === "pending");
  const activePlayers = players.filter(p => p.status === "approved");

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: SOLICITUDES PENDIENTES */}
      <section className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-4">
          <UserPlus className="w-6 h-6 text-amber-500" />
          <h2 className={`text-xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>
            Solicitudes Pendientes ({pendingRequests.length})
          </h2>
        </div>
        {pendingRequests.length === 0 ? (
          <div className="py-6 text-center flex flex-col items-center justify-center">
            <Users className="w-10 h-10 text-[#1c1611] mb-2" />
            <p className="text-[#8a7b6b] uppercase tracking-widest text-xs font-bold">No hay solicitudes nuevas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-black/40 border border-amber-900/20 p-4 rounded-sm flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#8a7b6b] mb-1">Candidato</p>
                  <p className={`text-lg font-bold text-amber-400 ${cinzel.className}`}>{req.profiles?.nickname || "Sin Apodo"}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleResolution(req.id, "approved")} 
                    isLoading={processingId === req.id}
                    disabled={processingId !== null}
                    className="!px-3 !bg-green-900/30 !border-green-800/50 hover:!bg-green-800/60 !text-green-400"
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                  <Button 
                    onClick={() => handleResolution(req.id, "rejected")} 
                    isLoading={processingId === req.id}
                    disabled={processingId !== null}
                    className="!px-3 !bg-red-900/30 !border-red-800/50 hover:!bg-red-800/60 !text-red-400"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECCIÓN 2: JUGADORES ACTIVOS */}
      <section className="bg-[#0e0917] border border-cyan-900/30 rounded-sm shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-cyan-900/30 pb-4">
          <UserCheck className="w-6 h-6 text-cyan-500" />
          <h2 className={`text-xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>
            Jugadores en la Liga ({activePlayers.length})
          </h2>
        </div>
        {activePlayers.length === 0 ? (
          <div className="py-6 text-center flex flex-col items-center justify-center">
            <Users className="w-10 h-10 text-[#1c1611] mb-2" />
            <p className="text-[#8a7b6b] uppercase tracking-widest text-xs font-bold">Aún no hay jugadores aprobados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activePlayers.map((player) => (
              <div key={player.id} className="bg-black/40 border border-cyan-900/20 p-4 rounded-sm flex items-center justify-between group">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-cyan-600 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Activo
                  </p>
                  <p className={`text-lg font-bold text-[#e8e0d5] group-hover:text-cyan-400 transition-colors ${cinzel.className}`}>
                    {player.profiles?.nickname || "Sin Apodo"}
                  </p>
                </div>
                {/* Botón para expulsar/revocar acceso (Opcional, pero útil para administrar) */}
                <button
                  onClick={() => handleResolution(player.id, "banned")}
                  disabled={processingId !== null}
                  className="p-2 text-[#8a7b6b] hover:text-red-500 hover:bg-red-950/30 rounded-sm transition-all opacity-0 group-hover:opacity-100"
                  title="Revocar acceso"
                >
                  <ShieldBan className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}