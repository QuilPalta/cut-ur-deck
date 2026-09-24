"use client";

import Link from "next/link";
import { Trophy, Swords, ScrollText, ArrowLeft, ShieldAlert, Users } from "lucide-react";
import { Cinzel } from "next/font/google";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function LeagueHeader() {
  const supabase = createClient();
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const { data: player } = await supabase.from("league_players").select("status").eq("id", session.user.id).single();
      if (player?.status === "approved") setIsApproved(true);

      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
      if (profile?.is_admin) setIsAdmin(true);

      setLoading(false);
    };
    checkAccess();
  }, [supabase]);

  return (
    <header className="relative z-20 border-b border-amber-900/30 bg-[#050308]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <Link href="/league" className="flex items-center gap-3 group">
          <Trophy className="w-6 h-6 text-amber-500 group-hover:text-amber-400 transition-colors drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className={`font-black tracking-widest text-lg uppercase text-amber-500 ${cinzel.className}`}>
            Liga Commander
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 overflow-x-auto">
          {/* Navegación Jugadores Aprobados */}
          {!loading && isApproved && (
            <>
              <Link href="/league" className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] hover:text-amber-400 transition-colors flex items-center gap-2">
                <Swords className="w-4 h-4" /> Posiciones
              </Link>
              <Link href="/league/achievements" className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] hover:text-amber-400 transition-colors flex items-center gap-2">
                <ScrollText className="w-4 h-4" /> Catálogo
              </Link>
            </>
          )}

          {/* Navegación Administrador (Botones Separados) */}
          {!loading && isAdmin && (
            <>
              <div className="w-px h-4 bg-amber-900/50 mx-1"></div>
              <Link href="/league/admin/leagues" className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-300 transition-colors flex items-center gap-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]">
                Ligas
              </Link>
              <Link href="/league/admin/players" className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-300 transition-colors flex items-center gap-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]">
                Jugadores
              </Link>
              <Link href="/league/admin/achievements" className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-300 transition-colors flex items-center gap-1 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]">
                Logros
              </Link>
            </>
          )}
          
          <div className="w-px h-4 bg-[#1c1611] mx-2"></div>
          
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-400 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Inventario
          </Link>
        </nav>
      </div>
    </header>
  );
}