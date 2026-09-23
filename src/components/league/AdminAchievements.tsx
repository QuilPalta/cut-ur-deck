"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Dices, Target, Trash2, ScrollText, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface Achievement { id: string; description: string; points: number; is_random: boolean; }

export default function AdminAchievements() {
  const supabase = createClient();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achDesc, setAchDesc] = useState("");
  const [achPoints, setAchPoints] = useState<number | "">("");
  const [achIsRandom, setAchIsRandom] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Modal State
  const [selectedAch, setSelectedAch] = useState<Achievement | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editPoints, setEditPoints] = useState<number | "">("");
  const [editIsRandom, setEditIsRandom] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchAchs = async () => {
      const { data } = await supabase.from("league_achievements").select("*").eq("is_deprecated", false).order("created_at", { ascending: false });
      if (data) setAchievements(data);
    };
    fetchAchs();
  }, [supabase]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achDesc.trim() || achPoints === "") return;
    setCreating(true);
    const { data } = await supabase.from("league_achievements").insert({ description: achDesc.trim(), points: Number(achPoints), is_random: achIsRandom }).select().single();
    if (data) {
      setAchievements([data, ...achievements]);
      setAchDesc(""); setAchPoints(""); setAchIsRandom(false);
    }
    setCreating(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAch || !editDesc.trim() || editPoints === "") return;
    setIsUpdating(true);
    const { error } = await supabase.from("league_achievements").update({ description: editDesc.trim(), points: Number(editPoints), is_random: editIsRandom }).eq("id", selectedAch.id);
    if (!error) {
      setAchievements(prev => prev.map(a => a.id === selectedAch.id ? { ...a, description: editDesc.trim(), points: Number(editPoints), is_random: editIsRandom } : a));
      setSelectedAch(null);
    }
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    if (!selectedAch || !window.confirm("¿Seguro que deseas ocultar este logro?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("league_achievements").update({ is_deprecated: true }).eq("id", selectedAch.id);
    if (!error) {
      setAchievements(prev => prev.filter(a => a.id !== selectedAch.id));
      setSelectedAch(null);
    }
    setIsDeleting(false);
  };

  return (
    <section className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-6 relative">
      <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-4">
        <ScrollText className="w-6 h-6 text-amber-500" />
        <h2 className={`text-xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>Catálogo de Logros</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-black/40 border border-amber-900/20 p-5 rounded-sm h-fit">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Forjar Nuevo</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input value={achDesc} onChange={(e) => setAchDesc(e.target.value)} placeholder="Descripción" required className="!border-amber-900/30 text-sm" />
            <Input type="number" value={achPoints} onChange={(e) => setAchPoints(e.target.value ? Number(e.target.value) : "")} placeholder="Puntos" required className="!border-amber-900/30 text-sm" />
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0a0710] border border-amber-900/30 rounded-sm hover:border-amber-500/50">
              <input type="checkbox" checked={achIsRandom} onChange={(e) => setAchIsRandom(e.target.checked)} className="w-4 h-4 accent-amber-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#8a7b6b]">¿Es al azar?</span>
            </label>
            <Button type="submit" isLoading={creating} className="w-full justify-center !bg-gradient-to-b !from-amber-600 !to-amber-900 !text-white">Guardar</Button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {achievements.map((ach) => (
              <div key={ach.id} onClick={() => { setSelectedAch(ach); setEditDesc(ach.description); setEditPoints(ach.points); setEditIsRandom(ach.is_random); }} className="bg-black/40 border border-amber-900/20 p-3 rounded-sm cursor-pointer hover:border-amber-500/50 hover:bg-[#150d22] group">
                <div className="flex justify-between mb-2">
                  {ach.is_random ? <span className="text-[10px] text-cyan-500 bg-cyan-950/50 px-2 py-1 rounded-sm border border-cyan-900/50 flex gap-1"><Dices className="w-3 h-3"/> Al Azar</span> : <span className="text-[10px] text-amber-500 bg-amber-950/50 px-2 py-1 rounded-sm border border-amber-900/50 flex gap-1"><Target className="w-3 h-3"/> Fijo</span>}
                  <span className={`text-lg font-black ${ach.points > 0 ? "text-green-500" : "text-red-500"}`}>{ach.points > 0 ? `+${ach.points}` : ach.points}</span>
                </div>
                <p className="text-sm text-[#e8e0d5] group-hover:text-amber-400">{ach.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedAch && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0e0917] border border-amber-500/50 rounded-sm p-6 w-full max-w-md">
            <h3 className={`text-xl font-bold uppercase text-amber-500 mb-6 border-b border-amber-900/50 pb-2 ${cinzel.className}`}>Editar Logro</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} required className="!border-amber-900/30 text-sm" />
              <Input type="number" value={editPoints} onChange={(e) => setEditPoints(e.target.value ? Number(e.target.value) : "")} required className="!border-amber-900/30 text-sm" />
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0a0710] border border-amber-900/30 rounded-sm">
                <input type="checkbox" checked={editIsRandom} onChange={(e) => setEditIsRandom(e.target.checked)} className="w-4 h-4 accent-amber-600" />
                <span className="text-xs font-bold uppercase text-[#8a7b6b]">¿Es al azar?</span>
              </label>
              <div className="flex gap-3 pt-4">
                <Button type="submit" isLoading={isUpdating} className="w-full justify-center !bg-amber-700 !text-white">Guardar</Button>
                <Button type="button" onClick={() => setSelectedAch(null)} className="w-full justify-center !bg-transparent !text-amber-500">Cancelar</Button>
              </div>
            </form>
            <button onClick={handleDelete} disabled={isDeleting} className="mt-6 flex items-center justify-center gap-2 w-full text-xs font-bold text-red-500 hover:text-red-400">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Eliminar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}