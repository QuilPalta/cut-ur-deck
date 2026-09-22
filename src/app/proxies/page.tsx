"use client";

import { useEffect, useState, useMemo } from "react";
import { Cinzel } from "next/font/google";
import { Printer, Copy, AlertTriangle, Sparkles, FileText, Settings, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface ProxyNeed {
  name: string;
  qty: number;
}

export default function ProxiesPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [missingStaples, setMissingStaples] = useState<ProxyNeed[]>([]);
  const [customProxies, setCustomProxies] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "print">("text");

  useEffect(() => {
    const calculateDeficit = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;

      const { data: decks } = await supabase.from("decks").select("id").eq("user_id", userId);
      const deckIds = decks?.map(d => d.id) || [];
      const { data: deckLists } = deckIds.length > 0 
        ? await supabase.from("deck_lists").select("deck_id, card_name, quantity").in("deck_id", deckIds) 
        : { data: [] };
      const { data: physicalCards } = await supabase.from("physical_cards").select("card_name, current_deck_id").eq("user_id", userId);

      if (physicalCards && deckLists) {
        const trackedStaples = Array.from(new Set(physicalCards.map(c => c.card_name)));
        const deficitMap = new Map<string, number>();

        deckLists.forEach(demand => {
          if (trackedStaples.includes(demand.card_name)) {
            // Evaluamos el déficit local: ¿Cuántas copias hay físicamente dentro de este mazo específico?
            const physicallyInDeck = physicalCards.filter(c => c.card_name === demand.card_name && c.current_deck_id === demand.deck_id).length;
            
            if (demand.quantity > physicallyInDeck) {
              const missingForThisDeck = demand.quantity - physicallyInDeck;
              const currentDeficit = deficitMap.get(demand.card_name) || 0;
              deficitMap.set(demand.card_name, currentDeficit + missingForThisDeck);
            }
          }
        });

        const deficit: ProxyNeed[] = Array.from(deficitMap.entries()).map(([name, qty]) => ({ name, qty }));
        deficit.sort((a, b) => a.name.localeCompare(b.name));
        setMissingStaples(deficit);
      }
      setLoading(false);
    };

    calculateDeficit();
  }, [supabase]);

  const finalProxyList = useMemo(() => {
    const list: ProxyNeed[] = [...missingStaples];
    
    if (customProxies.trim()) {
      const lines = customProxies.split('\n').filter(l => l.trim());
      lines.forEach(line => {
        const match = line.trim().match(/^(\d+)x?\s+(.+)$/);
        if (match) {
          const qty = parseInt(match[1]);
          const name = match[2].trim();
          const existing = list.find(i => i.name.toLowerCase() === name.toLowerCase());
          if (existing) existing.qty += qty;
          else list.push({ name, qty });
        } else {
          list.push({ name: line.trim(), qty: 1 });
        }
      });
    }
    return list;
  }, [missingStaples, customProxies]);

  const expandedPrintList = useMemo(() => {
    return finalProxyList.flatMap(item => Array(item.qty).fill(item.name));
  }, [finalProxyList]);

  const exportText = finalProxyList.map(item => `${item.qty} ${item.name}`).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (expandedPrintList.length === 0) return;
    setIsPrinting(true);

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      setIsPrinting(false);
      return;
    }

    // Dividir las cartas en bloques estrictos de 9
    const pages = [];
    for (let i = 0; i < expandedPrintList.length; i += 9) {
      pages.push(expandedPrintList.slice(i, i + 9));
    }

    const pagesHtml = pages.map(pageCards => `
      <div class="page">
        ${pageCards.map(cardName => `
          <div class="card">
            <img src="https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image" alt="${cardName}" />
          </div>
        `).join('')}
      </div>
    `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Proxies - Chaotic Storage</title>
          <style>
            @page { 
              size: auto; 
              margin: 4mm; /* Margen reducido para que quepan los 264mm de alto */
            }
            body { 
              margin: 0; 
              padding: 0; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              background: white;
            }
            .page { 
              page-break-after: always; 
              display: flex; 
              flex-wrap: wrap; 
              gap: 1mm; 
              justify-content: center; 
              align-content: flex-start;
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
              padding-top: 2mm; /* Pequeño respiro superior */
            }
            .page:last-child {
              page-break-after: auto;
            }
            .card { 
              width: 63mm; 
              height: 88mm; 
              box-sizing: border-box; 
              border: 1px solid #ccc; 
              position: relative; 
              overflow: hidden;
            }
            .card img { 
              width: 100%; 
              height: 100%; 
              object-fit: cover; 
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
      </html>
    `);
    doc.close();

    // Lógica para esperar que las imágenes carguen antes de imprimir
    const images = Array.from(doc.querySelectorAll("img"));
    let loadedCount = 0;
    let hasPrinted = false;
    const totalImages = images.length;

    const executePrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setIsPrinting(false);
      setTimeout(() => document.body.removeChild(iframe), 2000);
    };

    if (totalImages === 0) {
      executePrint();
      return;
    }

    images.forEach(img => {
      if (img.complete) {
        loadedCount++;
        if (loadedCount === totalImages) executePrint();
      } else {
        img.onload = () => {
          loadedCount++;
          if (loadedCount === totalImages) executePrint();
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === totalImages) executePrint();
        };
      }
    });

    // Fallback de seguridad: si las imágenes tardan más de 5 segundos, imprimimos igual
    setTimeout(() => {
      if (!hasPrinted) executePrint();
    }, 5000);
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-20 z-10 w-full print:hidden">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mb-4" />
        <p className={`text-sm font-bold tracking-widest uppercase text-[#8a7b6b] ${cinzel.className}`}>Calculando déficit logístico...</p>
      </main>
    );
  }

  return (
    <main className="relative flex-1 w-full max-w-5xl mx-auto px-6 py-10 z-10 flex flex-col gap-8 print:hidden">
      
      <header className="border-b border-[#8a7b6b]/20 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/30 border border-purple-800/30 rounded-full text-purple-400 text-[10px] font-bold tracking-widest uppercase mb-3">
          <Printer className="w-3 h-3 text-purple-400" /> Taller de Falsificación
        </div>
        <h1 className={`text-3xl md:text-5xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#e8e0d5] to-[#8a7b6b] drop-shadow-md ${cinzel.className}`}>
          Generador de Proxies
        </h1>
        <p className="text-[#a39481] mt-2 text-sm max-w-xl">
          El sistema ha calculado automáticamente los Staples que te faltan basándose en la demanda de tus mazos frente a tus copias físicas.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* PANEL IZQUIERDO: CONFIGURACIÓN */}
        <section className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-[#0e0917] border-2 border-[#1c1611] rounded-sm p-5 shadow-lg">
            <h3 className={`text-sm font-bold uppercase tracking-wider text-cyan-400 mb-4 flex items-center gap-2 ${cinzel.className}`}>
              <Sparkles className="w-4 h-4" /> Déficit Calculado
            </h3>
            
            {missingStaples.length === 0 ? (
              <p className="text-xs text-[#8a7b6b] italic">Tus Staples físicos cubren perfectamente la demanda actual de todos tus mazos.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {missingStaples.map((staple, i) => (
                  <li key={i} className="flex justify-between items-center text-xs bg-black/40 p-2 rounded-sm border border-[#1c1611]">
                    <span className="text-[#e8e0d5] truncate pr-2">{staple.name}</span>
                    <span className="font-mono text-cyan-500 font-bold">x{staple.qty}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[#0e0917] border-2 border-[#1c1611] rounded-sm p-5 shadow-lg flex-1 flex flex-col">
            <h3 className={`text-sm font-bold uppercase tracking-wider text-[#e8e0d5] mb-2 flex items-center gap-2 ${cinzel.className}`}>
              <Settings className="w-4 h-4 text-[#8a7b6b]" /> Adiciones Manuales
            </h3>
            <p className="text-[10px] text-[#8a7b6b] uppercase tracking-widest mb-3">
              ¿Quieres imprimir cartas extra o un mazo completo? Añádelas aquí.
            </p>
            <textarea 
              value={customProxies}
              onChange={(e) => setCustomProxies(e.target.value)}
              placeholder="1x Black Lotus&#10;2x Mana Crypt"
              className="flex-1 w-full p-3 bg-black/60 border border-[#8a7b6b]/40 rounded-sm text-xs text-[#e8e0d5] focus:border-cyan-400 transition-all font-mono resize-none min-h-[150px] custom-scrollbar"
            />
          </div>
        </section>

        {/* PANEL DERECHO: VISTAS Y EXPORTACIÓN */}
        <section className="w-full lg:w-2/3 flex flex-col gap-4">
          
          <div className="flex bg-[#050308] border border-[#1c1611] p-1 rounded-sm w-fit">
            <button 
              onClick={() => setActiveTab("text")} 
              className={`px-6 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all rounded-sm ${activeTab === "text" ? "bg-[#1c1611] text-cyan-400 shadow-md" : "text-[#8a7b6b] hover:text-[#e8e0d5]"}`}
            >
              <FileText className="w-4 h-4" /> Formato Proxxied
            </button>
            <button 
              onClick={() => setActiveTab("print")} 
              className={`px-6 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all rounded-sm ${activeTab === "print" ? "bg-[#1c1611] text-purple-400 shadow-md" : "text-[#8a7b6b] hover:text-[#e8e0d5]"}`}
            >
              <Printer className="w-4 h-4" /> PDF Montado
            </button>
          </div>

          <div className="bg-[#0e0917] border-2 border-[#1c1611] rounded-sm shadow-xl flex-1 p-6 relative overflow-hidden min-h-[400px]">
            <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
            
            <div className="relative z-10 h-full flex flex-col">
              {activeTab === "text" ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-[#8a7b6b] uppercase tracking-widest font-bold">
                      Lista lista para pegar en MPCFill, Proxxied o MTGPrint.
                    </p>
                    <Button variant="emerald" onClick={handleCopy} icon={copied ? <CheckCircle2 className="w-4 h-4"/> : <Copy className="w-4 h-4"/>} className="!py-1.5 !text-xs">
                      {copied ? "Copiado" : "Copiar Lista"}
                    </Button>
                  </div>
                  <div className="flex-1 bg-black/80 border border-[#1c1611] rounded-sm p-4 overflow-y-auto custom-scrollbar">
                    <pre className="font-mono text-sm text-cyan-100 whitespace-pre-wrap">
                      {exportText || "No hay cartas para procesar."}
                    </pre>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-[#1c1611] pb-4">
                    <div>
                      <p className="text-xs text-[#8a7b6b] uppercase tracking-widest font-bold">
                        Documento optimizado para tamaño Carta / A4.
                      </p>
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Calculando márgenes y resolución de Scryfall.
                      </p>
                    </div>
                    <Button 
                      variant="emerald" 
                      onClick={handlePrint} 
                      isLoading={isPrinting}
                      icon={!isPrinting ? <Printer className="w-4 h-4"/> : undefined} 
                      disabled={expandedPrintList.length === 0}
                    >
                      {isPrinting ? "Renderizando..." : "Generar PDF"}
                    </Button>
                  </div>
                  
                  {expandedPrintList.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[#8a7b6b]">
                      No hay cartas en la lista.
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/5 rounded-sm border border-[#1c1611] p-4 text-center flex flex-col justify-center items-center">
                      <p className={`text-4xl text-[#e8e0d5] mb-2 ${cinzel.className}`}>
                        {expandedPrintList.length} Cartas
                      </p>
                      <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest bg-cyan-950/30 border border-cyan-800/30 px-3 py-1 rounded-full">
                        {Math.ceil(expandedPrintList.length / 9)} Páginas
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}