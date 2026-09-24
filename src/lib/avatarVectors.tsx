import React from 'react';

// ==========================================
// BIBLIOTECA DE CABELLOS Y SOMBREROS
// ==========================================
export const HairVectors: Record<string, (color: string) => React.ReactNode> = {
  bald: () => null,
  
  short: (color) => (
    <path 
      d="M26 35C23 19 32 10 50 10s27 9 24 25c-5-11-13-17-24-17S31 24 26 35Z" 
      fill={color} 
    />
  ),
  
  spiky: (color) => (
    <path 
      d="M27 35 32 12l8 10L50 5l10 17 8-10 5 23c-8-7-16-10-23-10s-15 3-23 10Z" 
      fill={color} 
      stroke={color} 
      strokeWidth="2" 
      strokeLinejoin="round" 
    />
  ),
  
  // Afro Sólido (Sin opacity, como una nube densa de pelo)
  afro: (color) => (
    <g fill={color} stroke={color} strokeLinejoin="round">
      <circle cx="50" cy="18" r="22" />
      <circle cx="33" cy="25" r="15" />
      <circle cx="67" cy="25" r="15" />
      <circle cx="27" cy="37" r="11" />
      <circle cx="73" cy="37" r="11" />
    </g>
  ),

  mohawk: (color) => (
    <g>
      <path d="M42 25C42 10 45 2 50 2s8 8 8 23c-5-5-11-5-16 0Z" fill={color} />
      <path d="M46 23V8l4-10 4 10v15Z" fill="rgba(0,0,0,0.15)" />
    </g>
  ),

  wizardHat: () => (
    <g>
      <path d="M15 22h70c-2 5-15 8-35 8S17 27 15 22Z" fill="#4c1d95" />
      <path d="M27 22C33 9 41 1 65 2c-5 6-5 11 8 20Z" fill="#6d28d9" />
      <path d="M31 19c12 4 26 4 38 0l-2-4c-11 4-23 4-34 0Z" fill="#fbbf24" />
      <path d="m50 6 1.5 3.5H55l-2.5 2 1 3.5-3.5-2-3.5 2 1-3.5-2.5-2h3.5Z" fill="#fbbf24" />
    </g>
  ),
};

// ==========================================
// BIBLIOTECA DE VELLO FACIAL
// ==========================================
export const FacialHairVectors: Record<string, (color: string) => React.ReactNode> = {
  
  // Barba Sólida (Sin opacity)
  beard: (color) => (
    <path 
      d="M28 46c0 19 8 31 22 32 14-1 22-13 22-32-8 10-15 14-22 14s-14-4-22-14Z" 
      fill={color} 
      fillOpacity="1"
      opacity="1"
    />
  ),
  
  mustache: (color) => (
    <path 
      d="M38 52c4-5 8-6 12-2 4-4 8-3 12 2 0 5-7 6-12 2-5 4-12 3-12-2Z" 
      fill={color} 
    />
  ),
  
  goatee: (color) => (
    <path 
      d="M45 62c1 11 3 17 5 18 2-1 4-7 5-18-3 3-7 3-10 0Z" 
      fill={color} 
    />
  ),

  villainMustache: (color) => (
    <path 
      d="M25 50c8-2 17 0 25 2 8-2 17-4 25-2-6 6-15 7-25 2-10 5-19 4-25-2Z" 
      fill={color} 
      stroke={color} 
      strokeWidth="1.5" 
    />
  )
};