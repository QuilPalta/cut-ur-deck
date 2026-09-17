interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  color?: "cyan" | "emerald";
}

export default function Switch({ checked, onChange, label, color = "cyan" }: SwitchProps) {
  const activeBg = color === "cyan" ? "bg-cyan-950" : "bg-emerald-950";
  const activeBorder = color === "cyan" ? "border-cyan-400" : "border-emerald-400";
  const activeDot = color === "cyan" ? "bg-cyan-400" : "bg-emerald-400";

  return (
    <button 
      onClick={onChange}
      className="flex flex-col items-center gap-1.5 cursor-pointer group w-16"
      type="button"
    >
      <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${checked ? (color === "cyan" ? "text-cyan-400" : "text-emerald-400") : "text-[#8a7b6b]"}`}>
        {label}
      </span>
      <div className={`relative w-10 h-5 rounded-full border transition-colors duration-300 shadow-inner ${checked ? `${activeBg} ${activeBorder}` : "bg-black border-[#8a7b6b]"}`}>
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-300 shadow-md ${checked ? `left-[20px] ${activeDot}` : "left-1 bg-[#8a7b6b]"}`}></div>
      </div>
    </button>
  );
}