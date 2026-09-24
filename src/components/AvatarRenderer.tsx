"use client";
import { HairVectors, FacialHairVectors } from "@/lib/avatarVectors";

export interface AvatarConfig {
  skin: string;
  shirt: string;
  hair: string;
  hairColor: string;
  facialHair: string[];
}

interface AvatarRendererProps {
  config: AvatarConfig;
  className?: string;
}

export default function AvatarRenderer({ config, className = "w-24 h-24" }: AvatarRendererProps) {
  const skinColor = config.skin || "#f1c27d";
  const shirtColor = config.shirt || "#1e40af";
  const hairStyle = config.hair || "bald";
  const hairColor = config.hairColor || "#333333";
  
  const facialHairArray = Array.isArray(config.facialHair) 
    ? config.facialHair 
    : (typeof config.facialHair === 'string' && config.facialHair !== 'none' ? [config.facialHair] : []);

  // Separamos el vello facial para el sistema de capas
  const bottomFacialHair = facialHairArray.filter(fh => fh === 'beard' || fh === 'goatee');
  const topFacialHair = facialHairArray.filter(fh => fh === 'mustache' || fh === 'villainMustache');

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* CAPA 0: FONDO */}
      <circle cx="50" cy="50" r="50" fill="#0e0917" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.3" />

      {/* CAPA 1: CUERPO Y CUELLO */}
      <path d="M 20 100 C 20 60, 80 60, 80 100" fill={shirtColor} />
      <path d="M 35 100 C 35 75, 65 75, 65 100" fill="rgba(0,0,0,0.15)" />
      <rect x="42" y="60" width="16" height="20" fill={skinColor} />
      <rect x="42" y="60" width="16" height="5" fill="rgba(0,0,0,0.1)" />

      {/* CAPA 2: CABEZA */}
      <ellipse cx="50" cy="45" rx="22" ry="26" fill={skinColor} />

      {/* CAPA 3: CABELLO PRINCIPAL */}
      {HairVectors[hairStyle] && HairVectors[hairStyle](hairColor)}

      {/* CAPA 4: VELLO FACIAL BASE (Debajo de la boca) */}
      {bottomFacialHair.map(fh => (
        FacialHairVectors[fh] ? <g key={fh}>{FacialHairVectors[fh](hairColor)}</g> : null
      ))}

      {/* CAPA 5: BOCA (Dibuja SOBRE la barba clásica) */}
      <path d="M 43 54 Q 50 62 57 54" stroke="#111111" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* CAPA 6: VELLO FACIAL SUPERIOR (Sobre la boca) */}
      {topFacialHair.map(fh => (
        FacialHairVectors[fh] ? <g key={fh}>{FacialHairVectors[fh](hairColor)}</g> : null
      ))}

      {/* CAPA 7: OJOS */}
      <ellipse cx="41" cy="41" rx="2.5" ry="3.5" fill="#111111" />
      <ellipse cx="59" cy="41" rx="2.5" ry="3.5" fill="#111111" />
      <circle cx="42" cy="40" r="0.8" fill="white" />
      <circle cx="60" cy="40" r="0.8" fill="white" />

      {/* CAPA 8: CEJAS DINÁMICAS (Se dibujan al final para que resalten siempre) */}
      <path d="M 37 36 Q 41 34 45 36" stroke={hairColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 55 36 Q 59 34 63 36" stroke={hairColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />

    </svg>
  );
}