"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, ShieldAlert, Users, ScrollText, Trophy } from "lucide-react";
import AdminRequests from "@/components/league/AdminRequests";
import AdminAchievements from "@/components/league/AdminAchievements";
import AdminLeagues from "@/components/league/AdminLeagues";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

type AdminTab = "requests" | "achievements" | "leagues";

export default function LeagueAdminPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("leagues");

  useEffect(() => {
    const verifyAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single();
      if (profile?.is_admin) setIsAdmin(true);
      setLoading(false);
    };
    verifyAdmin();
  }, [supabase]);

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Verificando credenciales...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-600/80 mb-6" />
        <h1 className={`text-3xl font-black tracking-widest uppercase text-red-500 mb-4 ${cinzel.className}`}>Acceso Restringido</h1>
        <p className="text-[#8a7b6b] max-w-md mx-auto text-sm">Área reservada para organizadores de la liga.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-10">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className={`text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-700 drop-shadow-md flex items-center gap-3 ${cinzel.className}`}>
            <ShieldAlert className="w-8 h-8 text-amber-500" />
            Centro de Comando
          </h1>
          <p className="text-[#a39481] mt-2 text-sm">Arquitectura modular de administración.</p>
        </div>

        {/* Menú de Navegación del Admin */}
        <nav className="flex bg-[#0e0917] border border-amber-900/30 rounded-sm p-1 shadow-md w-full md:w-auto overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab("leagues")}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all whitespace-nowrap ${activeTab === "leagues" ? "bg-amber-900/40 text-amber-400 border border-amber-500/30" : "text-[#8a7b6b] hover:text-amber-500 hover:bg-black/30"}`}
          >
            <Trophy className="w-4 h-4" /> Ligas
          </button>
          <button 
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all whitespace-nowrap ${activeTab === "requests" ? "bg-amber-900/40 text-amber-400 border border-amber-500/30" : "text-[#8a7b6b] hover:text-amber-500 hover:bg-black/30"}`}
          >
            <Users className="w-4 h-4" /> Jugadores
          </button>
          <button 
            onClick={() => setActiveTab("achievements")}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all whitespace-nowrap ${activeTab === "achievements" ? "bg-amber-900/40 text-amber-400 border border-amber-500/30" : "text-[#8a7b6b] hover:text-amber-500 hover:bg-black/30"}`}
          >
            <ScrollText className="w-4 h-4" /> Logros
          </button>
        </nav>
      </header>

      {/* Renderizado Dinámico del Componente Activo */}
      <div className="animate-in fade-in duration-300">
        {activeTab === "leagues" && <AdminLeagues />}
        {activeTab === "requests" && <AdminRequests />}
        {activeTab === "achievements" && <AdminAchievements />}
      </div>
    </main>
  );
}