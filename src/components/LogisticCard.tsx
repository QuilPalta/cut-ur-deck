"use client";

import { useState } from "react";
import { MapPin, AlertTriangle, Layers } from "lucide-react";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface LocationData {
  deckName: string;
  qty: number;
}

interface StapleGroup {
  cardName: string;
  totalCopies: number;
  locations: LocationData[];
  missing: LocationData[];
}

interface LogisticCardProps {
  staple: StapleGroup;
  imageUrl: string;
  className?: string;
}

export default function LogisticCard({ staple, imageUrl, className = "" }: LogisticCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className={`relative w-full aspect-[63/88] [perspective:1000px] cursor-pointer ${className}`}
      onClick={handleClick}
    >
      {/* CONTENEDOR 3D */}
      <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] rounded-[4.5%] shadow-[0_20px_50px_rgba(0,0,0,0.8)] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        
        {/* CARA FRONTAL */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-[4.5%] overflow-hidden bg-[#050308] border-4 border-[#1c1611]">
          <img
            src={imageUrl}
            alt={staple.cardName}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
          
          <div className="absolute top-2 right-2 bg-[#1c1611]/90 border border-[#8a7b6b] px-2 py-1 rounded-sm flex items-center gap-1 shadow-lg backdrop-blur-sm">
            <Layers className="w-3 h-3 text-[#e8e0d5]" />
            <span className={`text-xs font-black text-[#e8e0d5] ${cinzel.className}`}>{staple.totalCopies}</span>
          </div>
        </div>

        {/* CARA TRASERA */}
        <div 
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[4.5%] border-4 border-[#1c1611] p-4 flex flex-col overflow-hidden"
          style={{ backgroundColor: "#e4e0d3" }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-5 rounded-sm shadow-sm opacity-40 bg-[#a6a298] -rotate-2"></div>
          
          <h3 className={`text-sm font-black text-center mt-3 mb-4 text-black leading-tight border-b border-black/20 pb-2 ${cinzel.className}`}>
            {staple.cardName}
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4 font-sans text-xs">
            
            <div className="flex items-center justify-between bg-black/5 p-2 rounded-sm border border-black/10">
              <span className="font-bold text-black/70 uppercase tracking-wider text-[9px]">Total Existencias</span>
              <span className="font-black text-black text-sm">{staple.totalCopies}</span>
            </div>

            {/* Asignadas en Mazos (Pepito tiene la manzana) */}
            {staple.locations.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-black/70 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-bold uppercase tracking-wider text-[9px]">Ubicaciones Físicas</span>
                </div>
                <div className="space-y-1">
                  {staple.locations.map((loc, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-blue-900/10 text-blue-950 p-1.5 rounded-sm border border-blue-900/20 text-[10px]">
                      <span className="truncate pr-2">{loc.deckName}</span>
                      <span className="font-black shrink-0">x{loc.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Faltantes (Juanito quiere la manzana) */}
            {staple.missing.length > 0 && (
              <div className="space-y-1.5 mt-auto pt-2 border-t border-red-900/20">
                <div className="flex items-center gap-1.5 text-red-700 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-bold uppercase tracking-wider text-[9px]">Receptores (Faltantes)</span>
                </div>
                <div className="space-y-1">
                  {staple.missing.map((miss, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-red-900/10 text-red-900 p-1.5 rounded-sm border border-red-900/20 text-[10px]">
                      <span className="truncate pr-2">{miss.deckName}</span>
                      <span className="font-black shrink-0">x{miss.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}