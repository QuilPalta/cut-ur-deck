import { Cinzel } from "next/font/google";
import { Loader2 } from "lucide-react";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "cyan" | "emerald" | "dark";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({ 
  children, 
  variant = "cyan", 
  isLoading, 
  icon, 
  className = "", 
  ...props 
}: ButtonProps) {
  
  const baseStyles = "px-8 py-3.5 border-2 rounded-sm font-bold text-white uppercase tracking-wider text-sm hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none shadow-[0_4px_0_#020104,inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_2px_0_#020104]";
  
  const variants = {
    cyan: "bg-gradient-to-b from-cyan-600 to-cyan-900 border-[#050308]",
    emerald: "bg-emerald-700/80 hover:bg-emerald-600 border-emerald-950",
    dark: "bg-gradient-to-b from-[#2a221a] to-[#1c1611] border-[#8a7b6b] text-[#e8e0d5] shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${cinzel.className} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}