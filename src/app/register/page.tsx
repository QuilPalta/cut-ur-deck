"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Sparkles, User, ShieldCheck } from "lucide-react";
import { Cinzel } from "next/font/google";
import Link from "next/link";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function RegisterPage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validación básica de contraseñas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. La magia requiere precisión.");
      setLoading(false);
      return;
    }

    if (nickname.trim().length < 3) {
      setError("Tu apodo debe tener al menos 3 caracteres.");
      setLoading(false);
      return;
    }

    // Registro en Supabase pasando el nickname como metadato
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname.trim(),
        }
      }
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("¡Alianza forjada! Revisa tu correo para confirmar tu cuenta.");
      // Opcional: router.push("/login") después de unos segundos
    }

    setLoading(false);
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-4 w-full z-10 my-8">
      
      {/* TARJETA / PLACA DE COMANDO */}
      <div 
        className="relative w-full max-w-md p-8 md:p-10 rounded-sm border-2 border-[#8a7b6b]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
        style={{ backgroundColor: "#0e0917" }}
      >
        <div 
          className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none" 
          style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
        ></div>

        {/* Barra superior de la tarjeta */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#8a7b6b]/20 pb-4 mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/40 border border-purple-800/40 rounded-full text-purple-400 text-[10px] font-bold tracking-widest uppercase">
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            Nuevo Recluta
          </div>
        </div>

        {/* Encabezado del Formulario */}
        <div className="text-center mb-8 relative z-10">
          <h1 className={`text-3xl font-black tracking-wider uppercase text-[#e8e0d5] drop-shadow-md ${cinzel.className}`}>
            Forja tu Cuenta
          </h1>
          <p className="text-sm text-[#a39481] mt-2 leading-relaxed">
            Ingresa tus credenciales para comenzar a gestionar tu bóveda.
          </p>
        </div>

        {/* Formulario */}
        <form className="space-y-5 relative z-10">
          
          {/* Input: Nickname */}
          <div className="space-y-1.5 text-left">
            <label className={`block text-xs font-bold uppercase tracking-wider text-[#a39481] ${cinzel.className}`}>
              Apodo (Nickname)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-[#8a7b6b]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-sm text-[#e8e0d5] placeholder:text-stone-600 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-sans"
                placeholder="Ej. Planeswalker99"
                required
              />
            </div>
          </div>

          {/* Input: Email */}
          <div className="space-y-1.5 text-left">
            <label className={`block text-xs font-bold uppercase tracking-wider text-[#a39481] ${cinzel.className}`}>
              Correo Electrónico
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-[#8a7b6b]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-sm text-[#e8e0d5] placeholder:text-stone-600 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-sans"
                placeholder="jugador@correo.com"
                required
              />
            </div>
          </div>

          {/* Input: Contraseña */}
          <div className="space-y-1.5 text-left">
            <label className={`block text-xs font-bold uppercase tracking-wider text-[#a39481] ${cinzel.className}`}>
              Contraseña
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-[#8a7b6b]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-sm text-[#e8e0d5] placeholder:text-stone-600 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-sans"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Input: Confirmar Contraseña */}
          <div className="space-y-1.5 text-left">
            <label className={`block text-xs font-bold uppercase tracking-wider text-[#a39481] ${cinzel.className}`}>
              Confirmar Contraseña
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-[#8a7b6b]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-sm text-[#e8e0d5] placeholder:text-stone-600 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all font-sans"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Mensajes de Estado */}
          {error && (
            <div className="p-3 text-xs text-red-200 bg-red-950/60 border border-red-800 rounded-sm text-center font-bold font-sans">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 text-xs text-emerald-200 bg-emerald-950/60 border border-emerald-800 rounded-sm text-center font-bold font-sans">
              {message}
            </div>
          )}

          {/* Botones */}
          <div className="space-y-4 pt-4">
            {/* Botón de Registro con toque morado para diferenciarlo del login */}
            <button
              type="submit"
              onClick={handleSignUp}
              disabled={loading}
              className={`w-full py-3.5 px-6 bg-gradient-to-b from-purple-600 to-purple-900 border-2 border-[#050308] rounded-sm font-bold text-white uppercase tracking-wider text-sm shadow-[0_4px_0_#020104,inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(147,51,234,0.25)] hover:translate-y-[2px] hover:shadow-[0_2px_0_#020104] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 ${cinzel.className}`}
            >
              {loading ? "Forjando..." : "Crear Cuenta"}
            </button>

            {/* Link de retorno al login */}
            <div className="text-center pt-2">
              <Link 
                href="/login"
                className={`text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] hover:text-[#e8e0d5] transition-colors ${cinzel.className}`}
              >
                ¿Ya tienes las llaves? Inicia Sesión
              </Link>
            </div>
          </div>

        </form>
      </div>

    </main>
  );
}