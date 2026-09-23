"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Cinzel } from "next/font/google";
import { ChevronLeft, Wrench, CheckCircle2, Box, Archive, MapPin, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { rebuildService, RebuildSource } from "@/lib/rebuildService";
import Button from "@/components/ui/Button";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function RebuildDeckPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;
  const supabase = createClient();

  const [deck, setDeck] = useState<any>(null);
  const [plan, setPlan] = useState<RebuildSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { deck, plan } = await rebuildService.getRebuildPlan(supabase, session.user.id, deckId);
          setDeck(deck);
          setPlan(plan);
        } catch (error) {
          console.error("Error generando plan:", error);
        }
      }
      setLoading(false);
    };
    fetchPlan();
  }, [deckId, supabase]);

  const handleExecuteRebuild = async () => {
    setExecuting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        // Extraemos todos los IDs físicos implicados en el plan
        const allCopyIds = plan.flatMap(source => source.items.flatMap(item => item.copyIds));
        await rebuildService.executeRebuild(supabase, session.user.id, deckId, allCopyIds);
        
        // Redirigir de vuelta al manifiesto del mazo, que ahora estará físicamente completo
        router.push(`/dashboard/deck/${deckId}`);
      } catch (error) {
        console.error("Error ejecutando reconstrucción:", error);
        setExecuting(false);
      }
    }
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 z-10 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Calculando logística de traspaso...</p>
      </main>
    );
  }

  return (
    <main className="relative flex-1 w-full max-w-4xl mx-auto px-6 py-10 z-10 flex flex-col gap-8">
      
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/deck/${deckId}`} className="inline-flex items-center gap-2 text-[#8a7b6b] hover:text-cyan-400 transition-colors w-fit">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Volver al Manifiesto</span>
        </Link>
      </div>

      <header className="border-b border-[#8a7b6b]/20 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/30 border border-amber-800/30 rounded-full text-amber-500 text-[10px] font-bold tracking-widest uppercase mb-3">
          <Wrench className="w-3 h-3 text-amber-500" /> Operación Logística
        </div>
        <h1 className={`text-3xl md:text-5xl font-black tracking-widest uppercase text-[#e8e0d5] drop-shadow-md ${cinzel.className}`}>
          Reconstruir Mazo
        </h1>
        <p className="text-[#a39481] mt-2 text-sm max-w-xl">
          Instrucciones de recolección para <strong>{deck?.name}</strong>. Recupera estas cartas de tus otros mazos para ensamblarlo físicamente.
        </p>
      </header>

      {plan.length === 0 ? (
        <section className="bg-[#050308]/80 border border-emerald-900/50 rounded-sm p-12 flex flex-col items-center text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
          <h2 className={`text-xl font-bold uppercase tracking-widest text-[#e8e0d5] mb-2 ${cinzel.className}`}>
            Ensamblaje Completo
          </h2>
          <p className="text-[#8a7b6b] max-w-md text-sm">
            Felicidades, este mazo ya cuenta con todas sus staples físicamente guardadas en su Deckbox. No hay movimientos logísticos pendientes.
          </p>
          <Link href={`/dashboard/deck/${deckId}`} className="mt-8 px-6 py-2 border-2 border-emerald-900 text-emerald-500 hover:bg-emerald-950/30 uppercase tracking-widest text-xs font-bold transition-colors rounded-sm">
            Regresar
          </Link>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LISTA DE INSTRUCCIONES */}
          <div className="space-y-6">
            {plan.map((source, idx) => (
              <div key={idx} className="bg-[#050308] border border-[#1c1611] rounded-sm overflow-hidden shadow-lg">
                <div className={`flex items-center gap-2 p-3 border-b border-[#1c1611] ${source.sourceId ? 'bg-blue-950/20 text-blue-400' : 'bg-emerald-950/20 text-emerald-400'}`}>
                  {source.sourceId ? <Box className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Extraer de: {source.sourceName}
                  </span>
                </div>
                
                <div className="p-4 space-y-2">
                  {source.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-black/40 rounded-sm border border-[#8a7b6b]/10">
                      <span className="text-[#e8e0d5] text-sm font-bold">{item.cardName}</span>
                      <span className="font-mono text-cyan-400 font-black">x{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* PANEL DE CONFIRMACIÓN */}
          <div className="sticky top-6 h-fit bg-[#0e0917] border-2 border-amber-900/40 rounded-sm p-6 shadow-xl flex flex-col gap-6">
            <div className="flex items-start gap-3 text-amber-500/80">
              <MapPin className="w-6 h-6 shrink-0" />
              <p className="text-xs font-bold leading-relaxed uppercase tracking-wider">
                Al confirmar, el sistema registrará que las {plan.reduce((acc, src) => acc + src.items.reduce((a, i) => a + i.qty, 0), 0)} cartas listadas han sido movidas exitosamente a la Deckbox de {deck?.name}.
              </p>
            </div>

            <Button 
              variant="emerald" 
              onClick={handleExecuteRebuild} 
              isLoading={executing}
              className="w-full h-14 text-sm"
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Confirmar Reconstrucción
            </Button>
          </div>
        </div>
      )}

    </main>
  );
}