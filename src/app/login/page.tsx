"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, Lock, Sparkles, Globe } from "lucide-react";
import { useTranslation, Language } from "@/hooks/useTranslation";
import { Cinzel } from "next/font/google";
import Link from "next/link";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function LoginPage() {
  const [lang, setLang] = useState<Language>("es");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const dict = useTranslation(lang);
  const t = dict.login;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center p-4 w-full z-10">
      
      {/* TARJETA / PLACA DE COMANDO */}
      <div 
        className="relative w-full max-w-md p-8 md:p-10 rounded-sm border-2 border-[#8a7b6b]/40 shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
        style={{ backgroundColor: "#0e0917" }}
      >
        {/* Textura de ruido */}
        <div 
          className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none" 
          style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
        ></div>

        {/* Barra superior de la tarjeta */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#8a7b6b]/20 pb-4 mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-full text-cyan-400 text-[10px] font-bold tracking-widest uppercase">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Acceso
          </div>

          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-[#8a7b6b]/30">
            <Globe className="w-3.5 h-3.5 text-[#8a7b6b]" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-transparent text-[11px] text-[#e8e0d5] font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
            >
              <option value="es" className="bg-[#0e0917]">ES</option>
              <option value="en" className="bg-[#0e0917]">EN</option>
              <option value="pt" className="bg-[#0e0917]">PT</option>
            </select>
          </div>
        </div>

        {/* Encabezado del Formulario */}
        <div className="text-center mb-8 relative z-10">
          <h1 className={`text-3xl font-black tracking-wider uppercase text-[#e8e0d5] drop-shadow-md ${cinzel.className}`}>
            {t.title}
          </h1>
          <p className="text-sm text-[#a39481] mt-2 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Formulario */}
        <form className="space-y-5 relative z-10">
          
          <div className="space-y-1.5 text-left">
            <label className={`block text-xs font-bold uppercase tracking-wider text-[#a39481] ${cinzel.className}`}>
              {t.emailLabel}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-[#8a7b6b]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-sm text-[#e8e0d5] placeholder:text-stone-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                placeholder={t.emailPlaceholder}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className={`block text-xs font-bold uppercase tracking-wider text-[#a39481] ${cinzel.className}`}>
              {t.passwordLabel}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none text-[#8a7b6b]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-sm text-[#e8e0d5] placeholder:text-stone-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                placeholder={t.passwordPlaceholder}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-xs text-red-200 bg-red-950/60 border border-red-800 rounded-sm text-center font-bold font-sans">
              {error}
            </div>
          )}

          <div className="space-y-5 pt-4">
            <button
              type="submit"
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3.5 px-6 bg-gradient-to-b from-cyan-600 to-cyan-900 border-2 border-[#050308] rounded-sm font-bold text-white uppercase tracking-wider text-sm shadow-[0_4px_0_#020104,inset_0_1px_1px_rgba(255,255,255,0.4),0_0_20px_rgba(8,145,178,0.25)] hover:translate-y-[2px] hover:shadow-[0_2px_0_#020104] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 ${cinzel.className}`}
            >
              {loading ? t.loading : t.loginBtn}
            </button>

            {/* SECCIÓN DE REGISTRO SEPARADA */}
            <div className="pt-5 border-t border-[#8a7b6b]/20 text-center">
              <p className={`text-[10px] font-black uppercase tracking-widest text-[#8a7b6b] mb-3 ${cinzel.className}`}>
                ¿Eres nuevo? Bienvenido, crea tu cuenta.
              </p>
              <Link
                href="/register"
                className={`flex justify-center items-center w-full py-2.5 px-6 bg-[#1c1611]/80 border-2 border-[#8a7b6b] text-[#e8e0d5] hover:bg-[#8a7b6b]/30 rounded-sm font-bold uppercase text-xs tracking-wider transition-all shadow-[0_3px_8px_rgba(0,0,0,0.4)] ${cinzel.className}`}
              >
                {t.registerBtn}
              </Link>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}