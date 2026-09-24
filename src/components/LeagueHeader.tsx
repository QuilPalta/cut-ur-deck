"use client";

import Link from "next/link";
import { Trophy, Swords, ScrollText, ArrowLeft, ShieldAlert, Menu, X, Calendar, User } from "lucide-react";
import { Cinzel } from "next/font/google";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function LeagueHeader() {
  const supabase = createClient();
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estado para el menú móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      
      setUserId(session.user.id);

      const { data: player } = await supabase.from("league_players").select("status").eq("id", session.user.id).single();
      if (player?.status === "approved") setIsApproved(true);

      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
      if (profile?.is_admin) setIsAdmin(true);

      setLoading(false);
    };
    checkAccess();
  }, [supabase]);

  // Función para cerrar el menú al hacer clic en un enlace (en móviles)
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="relative z-50 border-b border-amber-900/30 bg-[#050308]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        <Link href="/league" className="flex items-center gap-3 group" onClick={closeMenu}>
          <Trophy className="w-6 h-6 text-amber-500 group-hover:text-amber-400 transition-colors drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className={`font-black tracking-widest text-lg uppercase text-amber-500 ${cinzel.className}`}>
            Liga Commander
          </span>
        </Link>

        {/* Botón Hamburguesa (Solo Móvil) */}
        <button 
          className="md:hidden p-2 text-amber-500 hover:text-amber-400 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Navegación Escritorio (Oculta en móvil) */}
        <nav className="hidden md:flex items-center gap-6">
          {!loading && isApproved && (
            <>
              <Link href="/league" className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] hover:text-amber-400 transition-colors flex items-center gap-2">
                <Swords className="w-4 h-4" /> Posiciones
              </Link>
              <Link href="/league/matchdays" className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] hover:text-amber-400 transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Fechas
              </Link>
              <Link href="/league/achievements" className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] hover:text-amber-400 transition-colors flex items-center gap-2">
                <ScrollText className="w-4 h-4" /> Catálogo
              </Link>
              {userId && (
                <Link href={`/league/players/${userId}`} className="text-xs font-bold uppercase tracking-widest text-amber-500 hover:text-amber-300 transition-colors flex items-center gap-2 bg-amber-950/30 px-3 py-1.5 rounded-sm border border-amber-900/50">
                  <User className="w-4 h-4" /> Mi Perfil
                </Link>
              )}
            </>
          )}

          {!loading && isAdmin && (
            <>
              <div className="w-px h-4 bg-amber-900/50 mx-1"></div>
              <Link href="/league/admin/leagues" className="text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-400 transition-colors">
                Ligas
              </Link>
              <Link href="/league/admin/players" className="text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-400 transition-colors">
                Jugadores
              </Link>
              <Link href="/league/admin/achievements" className="text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-400 transition-colors">
                Logros
              </Link>
            </>
          )}
          
          <div className="w-px h-4 bg-[#1c1611] mx-2"></div>
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-cyan-600 hover:text-cyan-400 transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
        </nav>
      </div>

      {/* Menú Desplegable (Solo Móvil) */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#0e0917]/95 backdrop-blur-xl border-b border-amber-900/30 shadow-2xl flex flex-col md:hidden animate-in slide-in-from-top-2">
          {!loading && isApproved && (
            <div className="flex flex-col border-b border-white/5 py-2">
              {userId && (
                <Link href={`/league/players/${userId}`} onClick={closeMenu} className="px-6 py-4 text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-3 bg-amber-950/20 border-b border-amber-900/30">
                  <User className="w-5 h-5 text-amber-500" /> Mi Perfil
                </Link>
              )}
              <Link href="/league" onClick={closeMenu} className="px-6 py-4 text-sm font-bold uppercase tracking-widest text-[#e8e0d5] flex items-center gap-3">
                <Swords className="w-5 h-5 text-amber-500" /> Tabla de Posiciones
              </Link>
              <Link href="/league/matchdays" onClick={closeMenu} className="px-6 py-4 text-sm font-bold uppercase tracking-widest text-[#e8e0d5] flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-500" /> Historial de Fechas
              </Link>
              <Link href="/league/achievements" onClick={closeMenu} className="px-6 py-4 text-sm font-bold uppercase tracking-widest text-[#e8e0d5] flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-amber-500" /> Catálogo de Reglas
              </Link>
            </div>
          )}

          {!loading && isAdmin && (
            <div className="flex flex-col border-b border-white/5 py-2 bg-cyan-950/10">
              <p className="px-6 py-2 text-[10px] uppercase font-bold text-cyan-500/50 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Admin</p>
              <Link href="/league/admin/leagues" onClick={closeMenu} className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-cyan-500">Gestor de Ligas</Link>
              <Link href="/league/admin/players" onClick={closeMenu} className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-cyan-500">Solicitudes</Link>
              <Link href="/league/admin/achievements" onClick={closeMenu} className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-cyan-500">Logros Base</Link>
            </div>
          )}

          <div className="py-2 bg-black/40">
            <Link href="/dashboard" onClick={closeMenu} className="px-6 py-4 text-sm font-bold uppercase tracking-widest text-cyan-500 flex items-center gap-3">
              <ArrowLeft className="w-5 h-5" /> Volver al Inventario
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}