import { Swords, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Cinzel } from "next/font/google";
import Link from "next/link";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface DeckboxProps {
  id: string;
  name: string;
  commanderName: string;
  missingCount?: number;
}

export default function Deckbox({ id, name, commanderName, missingCount = 0 }: DeckboxProps) {
  const isComplete = missingCount === 0;

  return (
    <Link 
      href={`/dashboard/deck/${id}`} 
      className="group relative w-full bg-[#050308] border-2 border-[#1c1611] hover:border-cyan-900 rounded-sm p-5 transition-all flex flex-col justify-between overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1"
    >
      {/* Fondo decorativo que se enciende al pasar el mouse */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-tr from-cyan-900/20 to-transparent pointer-events-none group-hover:opacity-30 transition-opacity"></div>
      
      <div className="relative z-10 mb-6">
        <div className="flex items-center justify-between mb-3">
          <Swords className="w-5 h-5 text-[#8a7b6b] group-hover:text-cyan-400 transition-colors" />
          
          {/* Indicador de Estado Físico */}
          {isComplete ? (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-950/30 px-2 py-1 rounded-sm border border-emerald-900/50 shadow-inner">
              <CheckCircle2 className="w-3 h-3" /> Físicamente Completo
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-950/30 px-2 py-1 rounded-sm border border-red-900/50 shadow-inner">
              <AlertTriangle className="w-3 h-3" /> Faltan {missingCount}
            </span>
          )}
        </div>
        
        <h3 className={`text-xl font-black text-[#e8e0d5] group-hover:text-cyan-400 transition-colors uppercase tracking-widest truncate ${cinzel.className}`}>
          {name}
        </h3>
        <p className="text-xs text-[#8a7b6b] font-bold uppercase tracking-widest mt-1 truncate">
          Cmdr: {commanderName}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-[#1c1611] pt-4 mt-auto">
         <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">
           Inspeccionar Bóveda
         </span>
         <span className="text-[#8a7b6b] text-[10px] font-mono">ID: {id.split('-')[0]}</span>
      </div>
    </Link>
  );
}