export type Partido = {
  categoria: string;
  fecha: string;
  hora: string;
  equipo_local: string;
  equipo_visitante: string;
  resultado: string | null;
  pista: string;
  club1?: string;
  club2?: string;
};

export function parseFechaHora(fecha: string, hora: string) {
  const [d, m, y] = fecha.split("/").map(Number);
  const [h, min] = hora.split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

export function isValidPartido(p: Partial<Partido>): p is Partido {
  return Boolean(
    p.categoria &&
      p.fecha &&
      p.hora &&
      p.equipo_local &&
      p.equipo_visitante &&
      p.pista
  );
}
