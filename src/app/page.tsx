"use client";

import { useEffect, useState } from "react";
import { Cinzel } from "next/font/google";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import LogisticCard from "@/components/LogisticCard";
import { useScryfall } from "@/hooks/useScryfall";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function LandingPage() {
  const { getExactCard } = useScryfall();
  const [cardImage, setCardImage] = useState<string>("");

  // Usamos nuestro servicio para buscar el Rhystic Study dinámicamente al cargar la página
  useEffect(() => {
    const fetchLandingCard = async () => {
      const card = await getExactCard("Rhystic Study");
      if (card && card.image_uris) {
        setCardImage(card.image_uris.large || card.image_uris.normal);
      }
    };

    fetchLandingCard();
  }, [getExactCard]);

  // Datos de demostración para lucir la tarjeta interactiva 3D en la landing
  const demoStaple = {
    cardName: "Rhystic Study",
    totalCopies: 3,
    folderCopies: 1,
    locations: [
      { deckName: "Zimone", qty: 1 },
      { deckName: "Blech", qty: 1 }
    ],
    missing: [
      { deckName: "Nuevo Mazo Commander", qty: 1 }
    ]
  };

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col w-full">
      {/* CONTENIDO PRINCIPAL HERO */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-16 pt-10 pb-20">
        
        {/* Textos y CTA */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0a0612]/60 backdrop-blur-md border border-cyan-900/50 rounded-full text-cyan-300 text-xs font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(8,145,178,0.2)]">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Logística para Commander
          </div>
          
          <h1 className={`text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-wide text-transparent bg-clip-text bg-gradient-to-br from-white via-[#e8e0d5] to-[#8a7b6b] drop-shadow-lg ${cinzel.className}`}>
            Tus Staples, <br />
            <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.4)]">Bajo Control.</span>
          </h1>
          
          <p className="text-xl text-[#a39481] max-w-xl mx-auto lg:mx-0 leading-relaxed drop-shadow-md">
            Desarma, reconstruye y rastrea. Deja de buscar esa carta mítica que le prestaste a tu comandante nuevo. Encuentra tus staples en segundos y mantén tu colección física perfectamente organizada.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
            <Link 
              href="/login"
              className={`group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-b from-cyan-600 to-cyan-900 border-2 border-[#050308] rounded-sm font-bold text-white uppercase tracking-wider shadow-[0_4px_0_#020104,inset_0_1px_1px_rgba(255,255,255,0.4),0_0_30px_rgba(8,145,178,0.3)] hover:translate-y-[2px] hover:shadow-[0_2px_0_#020104,inset_0_1px_1px_rgba(255,255,255,0.4),0_0_30px_rgba(8,145,178,0.5)] active:translate-y-[4px] active:shadow-none transition-all ${cinzel.className}`}
            >
              Comenzar ahora
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Gráfico / Muestra Visual */}
        <div className="flex-1 relative w-full max-w-md lg:max-w-none flex justify-center perspective-1000 z-20">
          
          <LogisticCard 
            staple={demoStaple}
            imageUrl={cardImage || `https://api.scryfall.com/cards/named?exact=Rhystic+Study&format=image`} 
            className="w-64 md:w-80 rotate-[-3deg] hover:rotate-0 hover:-translate-y-4"
          />

        </div>
        
      </main>
    </div>
  );
}