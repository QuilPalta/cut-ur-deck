"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { User, Settings, LogOut, Swords, Printer, ChevronDown } from "lucide-react";
import { Cinzel } from "next/font/google";
import { useRouter } from "next/navigation";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState<string>("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Buscar la sesión al cargar el componente
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Rescatamos el apodo que guardamos en los metadatos al registrarnos
        setNickname(session.user.user_metadata?.nickname || "Planeswalker");
      }
    };
    fetchUser();

    // Escuchar cambios (por si inicias o cierras sesión)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setNickname(session.user.user_metadata?.nickname || "Planeswalker");
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
  };

  // Si no hay usuario, mostramos el botón clásico de "Entrar"
  if (!user) {
    return (
      <Link 
        href="/login" 
        className={`px-6 py-2 bg-[#1c1611]/80 border-2 border-[#8a7b6b] text-[#e8e0d5] hover:bg-[#8a7b6b]/30 rounded-sm font-bold uppercase text-sm tracking-wider transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)] ${cinzel.className}`}
      >
        Entrar
      </Link>
    );
  }

  // Si hay usuario, mostramos el menú interactivo
  return (
    <div className="relative">
      {/* Botón del Globito / Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#0e0917] border-2 border-[#8a7b6b]/60 rounded-sm hover:border-[#8a7b6b] hover:bg-[#1c1611] transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
      >
        <div className="w-7 h-7 bg-cyan-950/60 border border-cyan-800 rounded-sm flex items-center justify-center shadow-inner">
          <User className="w-4 h-4 text-cyan-400" />
        </div>
        <span className={`text-[#e8e0d5] font-bold text-xs tracking-wider uppercase hidden sm:block ${cinzel.className}`}>
          {nickname}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#8a7b6b] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Menú Desplegable (Caja de Opciones) */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-60 bg-[#0e0917] border-2 border-[#1c1611] rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 overflow-hidden">
          
          {/* Textura de ruido para mantener el diseño */}
          <div className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>

          <div className="relative z-10 flex flex-col">
            
            {/* Cabecera del Menú (Datos del jugador) */}
            <div className="px-4 py-3 border-b border-[#8a7b6b]/30 bg-[#050308]/60">
              <p className={`text-xs text-cyan-400 font-black uppercase tracking-widest ${cinzel.className}`}>{nickname}</p>
              <p className="text-[10px] text-[#8a7b6b] truncate mt-1">{user.email}</p>
            </div>

            {/* Opciones Principales */}
            <div className="py-2">
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8e0d5] hover:bg-[#1c1611] hover:text-cyan-400 transition-colors">
                <Swords className="w-4 h-4" />
                <span className={`font-bold tracking-wider ${cinzel.className}`}>Mis Mazos</span>
              </Link>

              {/* Opción dedicada a tu objetivo de impresión */}
              <Link href="/proxies" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8e0d5] hover:bg-[#1c1611] hover:text-cyan-400 transition-colors">
                <Printer className="w-4 h-4" />
                <span className={`font-bold tracking-wider ${cinzel.className}`}>Generador de Proxys</span>
              </Link>

              <Link href="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#e8e0d5] hover:bg-[#1c1611] hover:text-cyan-400 transition-colors">
                <Settings className="w-4 h-4" />
                <span className={`font-bold tracking-wider ${cinzel.className}`}>Ajustes de Cuenta</span>
              </Link>
            </div>

            {/* Botón de Cerrar Sesión */}
            <div className="border-t border-[#8a7b6b]/30 py-2 bg-[#050308]/30">
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className={`font-bold tracking-wider ${cinzel.className}`}>Abandonar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}