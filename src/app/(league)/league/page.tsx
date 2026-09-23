"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Cinzel } from "next/font/google";
import { Loader2, Swords, ShieldAlert, Clock, Trophy, Send, UserX } from "lucide-react";
import Button from "@/components/ui/Button";
import Link from "next/link";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

type PlayerStatus = "unauthenticated" | "none" | "pending" | "approved" | "rejected" | "banned";

export default function LeaguePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PlayerStatus>("unauthenticated");
  const [nickname, setNickname] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkLeagueStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setStatus("unauthenticated");
        setLoading(false);
        return;
      }

      console.log("ID del usuario activo:", session.user.id);

      // 1. Obtenemos su apodo global directamente de CutUrDeck (tabla profiles)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", session.user.id)
        .single();
        
      if (profileError) {
        console.error("🚨 Error de Supabase al buscar el perfil:", profileError.message, profileError.details);
      } else {
        console.log("✅ Perfil encontrado en BD:", profile);
      }
        
      if (profile?.nickname) {
        setNickname(profile.nickname);
      }

      // 2. Verificamos si ya solicitó ingreso a la liga
      const { data: player, error: playerError } = await supabase
        .from("league_players")
        .select("status")
        .eq("id", session.user.id)
        .single();

      if (playerError && playerError.code !== 'PGRST116') {
        // Ignoramos el error PGRST116 porque significa "No se encontraron filas", lo cual es normal si no se ha registrado en la liga
        console.error("🚨 Error al verificar estado de liga:", playerError.message);
      }

      if (player) {
        setStatus(player.status as PlayerStatus);
      } else {
        setStatus("none");
      }
      
      setLoading(false);
    };

    checkLeagueStatus();
  }, [supabase]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Enviamos la solicitud a la liga conectando directamente su ID
    const { error } = await supabase.from("league_players").insert({
      id: session.user.id,
      status: "pending"
    });

    if (!error) {
      setStatus("pending");
    } else {
      console.error("Error al solicitar ingreso:", error);
      alert("Hubo un error al procesar tu solicitud. Verifica la consola.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>
          Consultando registros del torneo...
        </p>
      </main>
    );
  }

  // ESTADO 0: Sin cuenta / Sin Loguear
  if (status === "unauthenticated") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
        <div className="w-full max-w-md bg-[#0e0917] border-2 border-amber-900/30 rounded-sm shadow-2xl p-8 relative z-10 text-center">
          <div className="mx-auto w-12 h-12 bg-black/40 border border-[#1c1611] rounded-full flex items-center justify-center mb-6">
            <UserX className="w-6 h-6 text-[#8a7b6b]" />
          </div>
          <h1 className={`text-2xl font-black tracking-widest uppercase text-[#e8e0d5] mb-4 ${cinzel.className}`}>Alto ahí</h1>
          <p className="text-[#8a7b6b] text-sm mb-8">
            No tienes cuenta o no estás logueado en <strong className="text-cyan-500">CutUrDeck</strong>. Inicia sesión para poder entrar a la liga.
          </p>
          <div className="flex flex-col gap-4">
            <Link href="/login" className="w-full py-3 px-6 bg-gradient-to-b from-amber-600 to-amber-900 border border-amber-950 text-white font-bold uppercase tracking-widest text-xs hover:from-amber-500 hover:to-amber-800 transition-all rounded-sm shadow-md flex items-center justify-center">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="w-full py-3 px-6 bg-transparent border-2 border-amber-900/50 text-amber-500 font-bold uppercase tracking-widest text-xs hover:bg-amber-950/30 hover:border-amber-700 transition-all rounded-sm flex items-center justify-center">
              Crear una Cuenta
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ESTADO 1: No ha solicitado ingreso
  if (status === "none") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
        <div className="w-full max-w-md bg-[#0e0917] border-2 border-amber-900/30 rounded-sm shadow-2xl p-8 relative z-10 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-950/40 border border-amber-900/50 rounded-full flex items-center justify-center mb-6">
            <Swords className="w-6 h-6 text-amber-500" />
          </div>
          <h1 className={`text-2xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#e8e0d5] to-amber-500 mb-2 ${cinzel.className}`}>
            Únete a la Liga
          </h1>
          
          <div className="my-6 p-4 bg-black/40 border border-amber-900/30 rounded-sm text-center">
            <p className="text-xs text-[#8a7b6b] uppercase tracking-widest font-bold mb-1">Tu Apodo de Combate:</p>
            <p className={`text-lg text-amber-400 font-bold ${cinzel.className}`}>
              {nickname || "Desconocido (No definido en CutUrDeck)"}
            </p>
            <p className="text-[10px] text-[#8a7b6b] mt-1">Vinculado automáticamente desde tu cuenta de CutUrDeck.</p>
          </div>

          <p className="text-[#8a7b6b] text-xs mb-8">
            Para acceder a las mesas de juego y registrar tus puntos, necesitas enviar una solicitud formal al organizador del torneo.
          </p>

          <form onSubmit={handleApply}>
            <Button type="submit" isLoading={submitting} className="w-full justify-center !bg-gradient-to-b !from-amber-600 !to-amber-900 !border-amber-950 !text-white hover:!from-amber-500 hover:!to-amber-800" icon={<Send className="w-4 h-4" />}>
              Solicitar Ingreso
            </Button>
          </form>
        </div>
      </main>
    );
  }

  // ESTADO 2: Solicitud pendiente
  if (status === "pending") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Clock className="w-16 h-16 text-amber-600/50 mb-6" />
        <h1 className={`text-3xl font-black tracking-widest uppercase text-amber-500 mb-4 ${cinzel.className}`}>Solicitud en Revisión</h1>
        <p className="text-[#8a7b6b] max-w-md mx-auto text-sm">
          Tu perfil bajo el nombre <strong className="text-[#e8e0d5]">"{nickname}"</strong> ha sido enlazado a la liga. Espera a que el administrador autorice tu entrada.
        </p>
      </main>
    );
  }

  // ESTADO 3: Rechazado o Baneado
  if (status === "rejected" || status === "banned") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-red-600/80 mb-6" />
        <h1 className={`text-3xl font-black tracking-widest uppercase text-red-500 mb-4 ${cinzel.className}`}>Acceso Denegado</h1>
        <p className="text-[#8a7b6b] max-w-md mx-auto text-sm">No tienes autorización para participar en esta liga. Contacta al administrador si crees que esto es un error.</p>
      </main>
    );
  }

  // ESTADO 4: Aprobado (El Dashboard Real de la Liga)
  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10">
      <header className="mb-10">
        <h1 className={`text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#e8e0d5] to-amber-600 drop-shadow-md ${cinzel.className}`}>
          Tabla de Posiciones
        </h1>
        <p className="text-[#a39481] mt-2 text-sm">
          Bienvenido de vuelta, <strong className="text-amber-400">{nickname}</strong>. Aquí se forjan las leyendas.
        </p>
      </header>

      <div className="bg-[#0e0917] border-2 border-amber-900/30 rounded-sm shadow-xl p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Trophy className="w-16 h-16 text-amber-900/40 mb-4" />
        <p className="text-[#8a7b6b] font-bold uppercase tracking-widest text-sm text-center">
          Las posiciones aún no se han calculado.<br/>
          (Próximamente conectaremos las mesas y puntuaciones)
        </p>
      </div>
    </main>
  );
}