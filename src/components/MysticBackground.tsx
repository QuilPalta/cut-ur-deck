export default function MysticBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      
      {/* Base oscura anclada aquí, NO en el body, para evitar colisiones */}
      <div className="absolute inset-0 bg-[#050308]"></div>
      
      {/* 1. Nebulosas de Éter */}
      <div 
        className="absolute inset-0 opacity-60 mix-blend-screen" 
        style={{
          background: 'radial-gradient(circle at 15% 20%, rgba(8, 145, 178, 0.15) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(88, 28, 135, 0.15) 0%, transparent 45%)'
        }}
      ></div>

      {/* 2. Cuadrícula Arcana */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(138,123,107,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(138,123,107,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>
      
      {/* 3. Textura de ruido táctil */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')"
        }}
      ></div>
    </div>
  );
}