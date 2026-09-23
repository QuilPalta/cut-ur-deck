import "./globals.css";
import { Cinzel, Inter } from "next/font/google";
import MysticBackground from "@/components/MysticBackground";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-cinzel" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Chaotic Storage & Liga",
  description: "Herramientas de logística y juego organizado para Magic: The Gathering.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="bg-[#020104] text-[#e8e0d5] min-h-screen flex flex-col font-sans selection:bg-cyan-900/50 selection:text-cyan-100">
        <MysticBackground />
        {children}
      </body>
    </html>
  );
}