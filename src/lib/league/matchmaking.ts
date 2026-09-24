export interface MatchmakingPlayer {
  id: string;
  nickname: string;
  score: number;
}

export interface Achievement {
  id: string;
  description: string;
  points: number;
  is_random: boolean;
}

/**
 * Ordena a los jugadores por puntaje y los divide matemáticamente en mesas de 4 y 3.
 */
export function buildEDHTables(players: MatchmakingPlayer[]): MatchmakingPlayer[][] {
  // 1. Ordenar por puntaje (El que tiene más puntos va primero)
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const n = sorted.length;

  // 2. Si son 5 o menos, juegan todos en una sola mesa (regla de oro de EDH)
  if (n <= 5) return [sorted];

  // 3. Algoritmo para maximizar mesas de 4 y usar mesas de 3 solo para rellenar
  const numTablesOf3 = (4 - (n % 4)) % 4;
  const numTablesOf4 = (n - (numTablesOf3 * 3)) / 4;

  const tables: MatchmakingPlayer[][] = [];
  let index = 0;

  // Primero armamos las mesas de 4 (Mesa 1, Mesa 2...)
  for (let i = 0; i < numTablesOf4; i++) {
    tables.push(sorted.slice(index, index + 4));
    index += 4;
  }

  // Luego armamos las mesas de 3 con los jugadores restantes
  for (let i = 0; i < numTablesOf3; i++) {
    tables.push(sorted.slice(index, index + 3));
    index += 3;
  }

  return tables;
}

/**
 * Toma el catálogo de logros sorteables de la liga, los baraja y extrae N cantidad.
 */
export function rollTableAchievements(pool: Achievement[], count: number = 6): Achievement[] {
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}