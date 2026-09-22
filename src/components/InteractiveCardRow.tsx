"use client";

import { useState } from "react";
import Switch from "@/components/ui/Switch";

const ManaIcon = ({ symbol }: { symbol: string }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) {
    return (
      <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white shadow-inner shrink-0" 
        style={{ backgroundColor: symbol === 'W' ? '#e2d8b5' : symbol === 'U' ? '#4f729b' : symbol === 'B' ? '#242424' : symbol === 'R' ? '#c75344' : symbol === 'G' ? '#69875c' : '#78716c' }}>
        {symbol}
      </span>
    );
  }
  return (
    <img src={`https://svgs.scryfall.io/card-symbols/${symbol}.svg`} alt={`Mana ${symbol}`} className="w-4 h-4 drop-shadow-md shrink-0" onError={() => setHasError(true)} />
  );
};

interface InteractiveCardRowProps {
  id: string;
  name: string;
  quantity: number;
  type?: string;
  colors?: string[];
  isStaple: boolean;
  inDeck: boolean;
  onPreview: (name: string) => void;
  onToggleStaple: (id: string) => void;
  onToggleInDeck: (id: string) => void;
}

export default function InteractiveCardRow({
  id, name, quantity, type, colors, isStaple, inDeck, onPreview, onToggleStaple, onToggleInDeck
}: InteractiveCardRowProps) {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 border-l-4 transition-colors rounded-r-sm shadow-sm ${
      isStaple ? "bg-cyan-950/10 border-cyan-800 hover:bg-cyan-950/30" : "bg-black/40 border-[#1c1611] hover:border-[#8a7b6b]/60"
    }`}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <span className={`font-mono font-black text-sm w-6 shrink-0 ${isStaple ? "text-cyan-400" : "text-[#8a7b6b]"}`}>
          {quantity}x
        </span>
        <div className="flex flex-col truncate">
          <button onClick={() => onPreview(name)} className={`font-bold text-sm text-left truncate hover:text-cyan-400 transition-colors ${isStaple ? "text-white" : "text-[#e8e0d5]"}`}>
            {name}
          </button>
          {type && <span className="text-stone-500 text-[10px] uppercase tracking-widest mt-0.5 truncate">{type}</span>}
        </div>
      </div>
      
      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
        {colors && (
          <div className="flex gap-1 shrink-0">
            {colors.length > 0 ? colors.map((c, i) => <ManaIcon key={i + c} symbol={c} />) : <ManaIcon symbol="C" />}
          </div>
        )}
        
        <div className="flex gap-4 shrink-0 bg-[#050308] p-2 border border-[#1c1611] rounded-sm shadow-inner">
          <Switch label="Staple" color="cyan" checked={isStaple} onChange={() => onToggleStaple(id)} />
          <div className="w-px bg-[#1c1611]"></div>
          <Switch label="En Mazo" color="emerald" checked={inDeck} onChange={() => onToggleInDeck(id)} />
        </div>
      </div>
    </div>
  );
}