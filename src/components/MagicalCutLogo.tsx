export default function MagicalCutLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] overflow-visible">
        {/* Mazo base (parte inferior) */}
        <path 
          d="M 25 35 L 75 35 Q 80 35 80 40 L 80 85 Q 80 90 75 90 L 25 90 Q 20 90 20 85 L 20 40 Q 20 35 25 35 Z" 
          fill="#1c1611" 
          stroke="#8a7b6b" 
          strokeWidth="3"
        />
        {/* Mazo base (parte superior desplazada) */}
        <path 
          d="M 15 10 L 65 10 Q 70 10 70 15 L 70 30 L 10 30 L 10 15 Q 10 10 15 10 Z" 
          fill="#2a221a" 
          stroke="#8a7b6b" 
          strokeWidth="3"
          className="transform -translate-x-1 -translate-y-1"
        />
        {/* El Tajo Mágico */}
        <path 
          d="M 5 45 L 95 20" 
          stroke="url(#glow-gradient)" 
          strokeWidth="4" 
          strokeLinecap="round"
          className="animate-pulse"
          style={{ filter: "drop-shadow(0px 0px 8px #06b6d4)" }}
        />
        {/* Partículas */}
        <circle cx="85" cy="25" r="1.5" fill="#22d3ee" className="animate-ping" style={{ animationDuration: '2s' }} />
        <circle cx="20" cy="40" r="1" fill="#67e8f9" />
        
        {/* Gradiente */}
        <defs>
          <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0891b2" />
            <stop offset="50%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#cffafe" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}