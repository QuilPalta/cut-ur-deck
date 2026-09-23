"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Plus, ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface League { id: string; name: string; is_active: boolean; }

export default function AdminLeagues() {
  const supabase = createClient();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchLeagues = async () => {
      const { data } = await supabase.from("leagues").select("*").order("created_at", { ascending: false });
      if (data) setLeagues(data);
    };
    fetchLeagues();
  }, [supabase]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    
    // Si es la primera, la marcamos como activa por defecto
    const isFirst = leagues.length === 0;
    
    const { data } = await supabase.from("leagues").insert({ name: name.trim(), is_active: isFirst }).select().single();
    if (data) {
      setLeagues([data, ...leagues]);
      setName("");
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    // Si la vamos a activar, desactivamos las demás primero para que solo haya 1 liga activa a la vez
    if (!currentStatus) {
      await supabase.from("leagues").update({ is_active: false }).neq("id", id);
    }
    await supabase.from("leagues").update({ is_active: !currentStatus }).eq("id", id);
    
    setLeagues(prev => prev.map(l => ({ ...l, is_active: l.id === id ? !currentStatus : (currentStatus ? l.is_active : false) })));
  };

  return (
    <section className="bg-[#0e0917] border border-amber-900/30 rounded-sm shadow-xl p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-amber-900/30 pb-4">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h2 className={`text-xl font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>Ligas y Temporadas</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-black/40 border border-amber-900/20 p-5 rounded-sm h-fit">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Liga</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Liga Commander 2026" required className="!border-amber-900/30 text-sm" />
            <Button type="submit" isLoading={creating} className="w-full justify-center !bg-gradient-to-b !from-amber-600 !to-amber-900 !text-white">Crear Temporada</Button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {leagues.length === 0 ? (
             <p className="text-sm text-[#8a7b6b] italic">No has creado ninguna liga aún.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {leagues.map((league) => (
                <div key={league.id} className={`p-4 rounded-sm border flex items-center justify-between ${league.is_active ? "bg-amber-950/20 border-amber-500/50" : "bg-black/40 border-amber-900/20 opacity-70"}`}>
                  <div>
                    <h4 className={`text-lg font-bold ${league.is_active ? "text-amber-400" : "text-[#8a7b6b]"} ${cinzel.className}`}>{league.name}</h4>
                    <p className="text-[10px] uppercase tracking-widest text-[#8a7b6b]">{league.is_active ? "Temporada en curso" : "Temporada archivada"}</p>
                  </div>
                  <Button 
                    onClick={() => toggleActive(league.id, league.is_active)}
                    className={`!px-4 !py-2 ${league.is_active ? "!bg-green-900/30 !text-green-500 !border-green-900/50" : "!bg-transparent !text-[#8a7b6b] hover:!text-amber-500"}`}
                  >
                    {league.is_active ? "Activa" : "Activar"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}