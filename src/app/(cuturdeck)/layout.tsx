import type { Metadata } from "next";
import { Cinzel, Crimson_Pro } from "next/font/google";
import "@/app/globals.css";
import Link from "next/link";
import MagicalCutLogo from "@/components/MagicalCutLogo";
import MysticBackground from "@/components/MysticBackground";
import UserMenu from "@/components/UserMenu"; // Importamos el nuevo componente

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const crimson = Crimson_Pro({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "Cut Ur Deck",
  description: "Centro de comando y logística para tus mazos de Commander.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${crimson.className} min-h-screen flex flex-col text-[#e8e0d5] selection:bg-cyan-900/50`}>
        
        {/* FONDO GLOBAL INYECTADO */}
        <MysticBackground />
        
        {/* ENCABEZADO GLOBAL */}
        <header className="relative z-50 w-full border-b-[3px] border-[#1c1611] shadow-2xl" style={{ backgroundColor: "#0a0612" }}>
          
          <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}></div>
          
          <nav className="relative w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 group">
              <MagicalCutLogo className="w-12 h-12 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
              <div className="flex flex-col">
                <span className={`text-2xl font-black tracking-widest uppercase text-[#e8e0d5] leading-none drop-shadow-md ${cinzel.className}`}>
                  Cut Ur Deck
                </span>
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mt-1">
                  Logística de Staples
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {/* Aquí insertamos el componente inteligente que maneja el perfil */}
              <UserMenu />
            </div>
          </nav>
        </header>

        {/* CONTENEDOR DE VISTAS DINÁMICAS */}
        <div className="flex-1 relative flex flex-col z-10">
          {children}
        </div>

      </body>
    </html>
  );
}