"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, UserCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { Cinzel } from "next/font/google";
import AvatarRenderer, { AvatarConfig } from "@/components/AvatarRenderer";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

const SKIN_COLORS = ["#ffdbac", "#f1c27d", "#e0ac69", "#8d5524", "#4d2600", "#718096", "#22c55e"]; // Agregué un verde orco
const SHIRT_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#1f2937", "#f43f5e"];
const HAIR_COLORS = ["#111111", "#45220a", "#b45309", "#fcd34d", "#d1d5db", "#ef4444", "#3b82f6", "#a855f7"];

const HAIR_STYLES = [
  { id: "bald", label: "Calvo" },
  { id: "short", label: "Corto" },
  { id: "spiky", label: "Puntiagudo" },
  { id: "afro", label: "Afro" },
  { id: "mohawk", label: "Cresta Punk" },
  { id: "wizardHat", label: "Sombrero Mágico" },
];

const FACIAL_HAIR = [
  { id: "beard", label: "Barba Clásica" },
  { id: "mustache", label: "Bigote" },
  { id: "goatee", label: "Perilla" },
  { id: "villainMustache", label: "Bigote Villano" },
];

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<AvatarConfig>({
    skin: "#f1c27d",
    shirt: "#3b82f6",
    hair: "short",
    hairColor: "#111111",
    facialHair: []
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from("profiles")
        .select("nickname, avatar_config")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setNickname(data.nickname || "");
        if (data.avatar_config) {
          // Normalizar datos antiguos
          const conf = data.avatar_config as any;
          setAvatar({
            ...conf,
            facialHair: Array.isArray(conf.facialHair) ? conf.facialHair : (conf.facialHair && conf.facialHair !== 'none' ? [conf.facialHair] : [])
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          nickname: nickname.trim(), 
          avatar_config: avatar 
        })
        .eq("id", session.user.id);
        
      if (!error) {
        alert("¡Gladiador actualizado con éxito!");
        window.location.reload(); 
      } else {
        alert("Error al guardar los cambios.");
      }
    }
    setSaving(false);
  };

  const updateAvatar = (key: keyof AvatarConfig, value: string) => {
    setAvatar(prev => ({ ...prev, [key]: value }));
  };

  // Función especial para manejar la combinación de vello facial
  const toggleFacialHair = (id: string) => {
    setAvatar(prev => {
      const current = prev.facialHair || [];
      if (current.includes(id)) {
        return { ...prev, facialHair: current.filter(x => x !== id) };
      } else {
        return { ...prev, facialHair: [...current, id] };
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Cargando forja...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 sm:py-10 space-y-8">
      
      <header className="border-b border-cyan-900/30 pb-4 mb-8">
        <h1 className={`text-3xl font-black tracking-widest uppercase text-cyan-500 flex items-center gap-3 ${cinzel.className}`}>
          <UserCircle className="w-8 h-8" />
          Configuración de Perfil
        </h1>
        <p className="text-[#8a7b6b] mt-2 text-sm">Personaliza tu apodo y forja tu avatar de batalla.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* PREVISUALIZACIÓN DEL AVATAR */}
        <div className="md:col-span-1">
          <div className="bg-[#0e0917] border border-cyan-900/30 rounded-sm p-6 shadow-xl sticky top-6 flex flex-col items-center text-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b] mb-6">Tu Gladiador</h2>
            
            <div className="w-48 h-48 mb-6 drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <AvatarRenderer config={avatar} className="w-full h-full" />
            </div>

            <h3 className={`text-xl font-bold text-[#e8e0d5] ${cinzel.className} mb-1`}>{nickname || "Sin Apodo"}</h3>
            <p className="text-[10px] uppercase text-cyan-600 font-bold tracking-widest">Listo para el combate</p>

            <Button onClick={handleSave} isLoading={saving} className="w-full mt-8 justify-center !bg-cyan-600 hover:!bg-cyan-500 !text-white">
              <Save className="w-4 h-4 mr-2" /> Guardar Cambios
            </Button>
          </div>
        </div>

        {/* PANELES DE EDICIÓN */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-black/40 border border-white/5 p-5 rounded-sm">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] mb-2">Apodo de Batalla</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Ej. Jace Beleren"
              className="w-full bg-[#0e0917] border border-cyan-900/50 p-3 rounded-sm text-white focus:border-cyan-500 outline-none transition-colors"
            />
          </div>

          <div className="bg-black/40 border border-white/5 p-5 rounded-sm">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] mb-3">Tono de Piel</label>
            <div className="flex flex-wrap gap-3">
              {SKIN_COLORS.map(color => (
                <button key={color} onClick={() => updateAvatar("skin", color)} className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${avatar.skin === color ? "border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "border-transparent"}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-5 rounded-sm">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] mb-3">Color de Armadura/Polera</label>
            <div className="flex flex-wrap gap-3">
              {SHIRT_COLORS.map(color => (
                <button key={color} onClick={() => updateAvatar("shirt", color)} className={`w-10 h-10 rounded-sm border-2 transition-transform hover:scale-110 ${avatar.shirt === color ? "border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "border-transparent"}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-5 rounded-sm">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] mb-3">Color de Cabello / Vello</label>
            <div className="flex flex-wrap gap-3">
              {HAIR_COLORS.map(color => (
                <button key={color} onClick={() => updateAvatar("hairColor", color)} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${avatar.hairColor === color ? "border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "border-transparent"}`} style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-5 rounded-sm">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] mb-3">Estilo de Cabello</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {HAIR_STYLES.map(style => (
                <button key={style.id} onClick={() => updateAvatar("hair", style.id)} className={`p-2 text-xs font-bold uppercase tracking-widest rounded-sm border transition-colors ${avatar.hair === style.id ? "bg-cyan-950/40 border-cyan-500 text-cyan-400" : "bg-[#0e0917] border-white/5 text-[#8a7b6b] hover:border-cyan-900/50"}`}>
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-5 rounded-sm">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a7b6b] mb-3">Vello Facial (¡Puedes combinarlos!)</label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {FACIAL_HAIR.map(style => {
                const isActive = (avatar.facialHair || []).includes(style.id);
                return (
                  <button key={style.id} onClick={() => toggleFacialHair(style.id)} className={`p-2 text-xs font-bold uppercase tracking-widest rounded-sm border transition-colors ${isActive ? "bg-cyan-950/40 border-cyan-500 text-cyan-400" : "bg-[#0e0917] border-white/5 text-[#8a7b6b] hover:border-cyan-900/50"}`}>
                    {style.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-cyan-600 mt-2 italic">* Presiona para agregar o quitar.</p>
          </div>

        </div>
      </div>
    </div>
  );
}