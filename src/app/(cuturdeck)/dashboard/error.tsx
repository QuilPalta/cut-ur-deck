"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Cinzel } from "next/font/google";
import Link from "next/link";
import Button from "@/components/ui/Button";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí podrías conectar Sentry u otro servicio de tracking en el futuro
    console.error("Falla en la Forja:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-8 px-6 text-center z-10 relative">
      <div className="relative">
        <div className="absolute inset-0 bg-red-900/20 blur-xl rounded-full"></div>
        <div className="p-6 bg-[#1c1611]/80 border-2 border-red-900/50 rounded-full relative z-10">
          <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
        </div>
      </div>

      <div className="space-y-3 max-w-md">
        <h2 className={`text-2xl md:text-3xl font-black uppercase tracking-widest text-[#e8e0d5] ${cinzel.className}`}>
          Fisura en el Nexo
        </h2>
        <p className="text-[#a39481] text-sm leading-relaxed">
          Las energías mágicas se han desestabilizado. Ocurrió un error inesperado al intentar renderizar esta sección del plano.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
        <Button 
          onClick={() => reset()} 
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Canalizar de nuevo
        </Button>
        
        <Link href="/dashboard" className="px-6 py-2.5 bg-transparent border border-[#8a7b6b]/30 text-[#e8e0d5] text-xs font-bold uppercase tracking-widest hover:bg-[#1c1611] hover:border-[#8a7b6b] transition-all flex items-center gap-2 rounded-sm shadow-md">
          <Home className="w-4 h-4" />
          Volver a la Bóveda
        </Link>
      </div>
    </div>
  );
}