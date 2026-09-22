"use client";

import { useState } from "react";
import { Cinzel } from "next/font/google";
import { Link as LinkIcon, FileText, AlertTriangle, ArrowRight, Save, Swords, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { importDeckFromMoxfield, ParsedCard } from "@/lib/moxfield";
import { deckService } from "@/lib/deckService";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InteractiveCardRow from "@/components/InteractiveCardRow";
import CardPreviewModal from "@/components/CardPreviewModal";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function CreateDeckPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [deckName, setDeckName] = useState("");
  const [importType, setImportType] = useState<"text" | "moxfield">("text");
  const [rawList, setRawList] = useState("");
  const [moxfieldUrl, setMoxfieldUrl] = useState("");
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [previewCard, setPreviewCard] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setImportError(null);
    try {
      if (importType === "text") {
        if (!rawList.trim()) throw new Error("La lista de texto está vacía.");
        const lines = rawList.split('\n').filter(line => line.trim() !== '');
        const newCards = lines.map((line, idx) => {
          const match = line.trim().match(/^(\d+)x?\s+(.+)$/);
          return { id: String(idx), qty: match ? parseInt(match[1]) : 1, name: match ? match[2].trim() : line.trim(), type: "Carta", colors: [], isStaple: false, inDeck: true };
        });
        setParsedCards(newCards);
      } else {
        const { name, cards } = await importDeckFromMoxfield(moxfieldUrl);
        setParsedCards(cards);
        if (!deckName) setDeckName(name);
      }
      setStep(2);
    } catch (error: any) {
      setImportError(error.message || "Error al analizar el mazo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStaple = (id: string) => setParsedCards(prev => prev.map(card => card.id === id ? { ...card, isStaple: !card.isStaple } : card));
  const toggleInDeck = (id: string) => setParsedCards(prev => prev.map(card => card.id === id ? { ...card, inDeck: !card.inDeck } : card));

  const handleSaveDeck = async () => {
    setSaving(true);
    setImportError(null);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      setImportError("No hay una sesión activa. Por favor vuelve a iniciar sesión.");
      setSaving(false); return;
    }

    try {
      const newDeckId = await deckService.createDeck(
        supabase, 
        session.user.id, 
        deckName, 
        parsedCards[0]?.name || "Comandante Desconocido", 
        parsedCards
      );
      
      router.push(`/dashboard/deck/${newDeckId}`);
    } catch (error: any) {
      const errorCode = error?.code ? ` [Código: ${error.code}]` : "";
      const errorMsg = error?.message || error?.details || JSON.stringify(error);
      
      let friendlyError = errorMsg;
      if (error?.code === 'PGRST116') friendlyError = "Bloqueo de seguridad (RLS). Apaga RLS.";
      else if (error?.code === '23503') friendlyError = "Falta tu usuario en profiles.";

      setImportError(`Fallo al encriptar: ${friendlyError}${errorCode}`);
      setSaving(false);
    }
  };

  return (
    <main className="relative flex-1 w-full max-w-5xl mx-auto px-6 py-10 z-10 flex flex-col gap-8">
      
      {/* Componente Modal Extraído */}
      {previewCard && (
        <CardPreviewModal cardName={previewCard} onClose={() => setPreviewCard(null)} />
      )}

      <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#8a7b6b] hover:text-cyan-400 transition-colors w-fit">
        <ChevronLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Volver a la Bóveda</span>
      </Link>

      <header className="border-b border-[#8a7b6b]/20 pb-6">
        <h1 className={`text-3xl md:text-4xl font-black tracking-widest uppercase text-[#e8e0d5] drop-shadow-md ${cinzel.className}`}>Forja de Mazo</h1>
        <p className="text-[#a39481] mt-2 text-sm max-w-2xl">
          {step === 1 ? "Ingresa el código base de tu mazo." : "Audita las cartas identificadas. Marca qué cartas son Staples de tu carpeta."}
        </p>
      </header>

      {importError && step === 2 && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-200 font-bold break-words">{importError}</p>
        </div>
      )}

      {step === 1 && (
        <section className="bg-[#0e0917] border-2 border-[#1c1611] rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
          <div className="relative z-10 p-6 md:p-8 flex flex-col gap-8">
            <div className="space-y-2">
              <label className={`block text-xs font-bold uppercase tracking-wider text-[#a39481] ${cinzel.className}`}>Identificador del Mazo</label>
              <Input icon={<Swords className="w-4 h-4" />} value={deckName} onChange={(e) => setDeckName(e.target.value)} placeholder="Ej. Mi primer mazo Commander (Opcional)" />
            </div>

            <div className="space-y-4">
              <label className={`block text-xs font-bold uppercase tracking-wider text-[#a39481] ${cinzel.className}`}>Origen de los Datos</label>
              <div className="flex bg-[#050308] border border-[#1c1611] p-1 rounded-sm">
                <button onClick={() => { setImportType("text"); setImportError(null); }} className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${importType === "text" ? "bg-[#1c1611] text-cyan-400 shadow-md" : "text-[#8a7b6b] hover:text-[#e8e0d5]"}`}><FileText className="w-4 h-4" /> Texto Plano</button>
                <button onClick={() => { setImportType("moxfield"); setImportError(null); }} className={`flex-1 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${importType === "moxfield" ? "bg-[#1c1611] text-cyan-400 shadow-md" : "text-[#8a7b6b] hover:text-[#e8e0d5]"}`}><LinkIcon className="w-4 h-4" /> Moxfield</button>
              </div>

              {importType === "text" ? (
                <textarea value={rawList} onChange={(e) => setRawList(e.target.value)} className="w-full h-48 p-4 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-sm text-[#e8e0d5] focus:border-cyan-400 transition-all font-mono resize-none" placeholder="1x Sol Ring&#10;1x Arcane Signet" />
              ) : (
                <div className="space-y-4">
                  <Input type="url" value={moxfieldUrl} onChange={(e) => setMoxfieldUrl(e.target.value)} placeholder="https://www.moxfield.com/decks/..." />
                </div>
              )}
            </div>

            {importError && <div className="p-3 bg-red-950/60 border border-red-800 rounded-sm text-red-300 text-xs font-bold text-center">{importError}</div>}
            <div className="pt-4 border-t border-[#8a7b6b]/20 flex justify-end">
              <Button onClick={handleAnalyze} isLoading={loading} icon={<ArrowRight className="w-4 h-4" />}>Auditar Lista</Button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="bg-[#0e0917] border-2 border-[#1c1611] rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col h-[70vh]">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
          <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-[#050308] border-b border-[#1c1611]">
            <div className="flex items-center gap-4">
              <h2 className={`text-lg font-bold uppercase tracking-wider text-cyan-400 ${cinzel.className}`}>{deckName || "Mazo sin título"}</h2>
              <span className="px-2 py-1 bg-[#1c1611] border border-[#8a7b6b]/30 rounded-sm text-[10px] font-bold text-[#8a7b6b] uppercase tracking-widest">{parsedCards.reduce((acc, curr) => acc + curr.qty, 0)} Cartas</span>
            </div>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 space-y-2 custom-scrollbar">
            {parsedCards.map((card) => (
              <InteractiveCardRow
                key={card.id}
                id={card.id}
                name={card.name}
                quantity={card.qty}
                type={card.type}
                colors={card.colors}
                isStaple={card.isStaple}
                inDeck={card.inDeck}
                onPreview={setPreviewCard}
                onToggleStaple={toggleStaple}
                onToggleInDeck={toggleInDeck}
              />
            ))}
          </div>

          <div className="relative z-10 border-t border-[#1c1611] p-6 bg-[#050308] flex justify-between items-center">
            <button onClick={() => setStep(1)} className={`px-4 py-2 text-xs font-bold text-[#8a7b6b] hover:text-[#e8e0d5] uppercase tracking-widest transition-colors ${cinzel.className}`}>Regresar</button>
            <Button variant="emerald" onClick={handleSaveDeck} isLoading={saving} icon={<Save className="w-4 h-4" />}>Encriptar Mazo</Button>
          </div>
        </section>
      )}
    </main>
  );
}