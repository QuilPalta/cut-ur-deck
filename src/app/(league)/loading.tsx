import { Swords } from "lucide-react";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-6 z-10 relative">
      <div className="relative flex items-center justify-center">
        {/* Anillo exterior rotando */}
        <div className="absolute w-20 h-20 border-t-2 border-b-2 border-cyan-500/50 rounded-full animate-spin"></div>
        {/* Anillo interior rotando en reversa */}
        <div className="absolute w-16 h-16 border-l-2 border-r-2 border-[#8a7b6b]/50 rounded-full animate-[spin_1.5s_linear_reverse]"></div>
        {/* Ícono central pulsando */}
        <Swords className="w-8 h-8 text-cyan-400 animate-pulse" />
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <h2 className={`text-lg font-bold tracking-widest uppercase text-[#e8e0d5] ${cinzel.className}`}>
          Canalizando Maná
        </h2>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
      </div>
    </div>
  );
}