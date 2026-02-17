// Función para abreviar nombres de clubs de hockey
export function abbreviateClub(name: string) {
  // Siempre usar la abreviatura si existe
  if (name === "JESUS MARIA I JOSEP B") return "JMJ";
  if (name === "UNIÓ ESPORTIVA D'HORTA A") return "U.E HORTA A";
  if (name === "JOIERIA MONER CP SANT RAMON A") return "St. RAMON";
  if (name === "INNOAESTHETICS HC SANT JUST B") return "St. JUST B";
  if (name === "CP CONGRÉS-LA SAGRERA ES MOU D") return "CONGRÉS D";
  if (name === "CE ARENYS DE MUNT B") return "ARENYS DE MUNT B";
  if (name === "CP MONTESQUIU A") return "MONTESQUIU A";
  // Si no, trunca a 18 caracteres siempre (desktop y móvil)
  if (name.length <= 18) return name;
  return name.slice(0, 18) + "…";
}
