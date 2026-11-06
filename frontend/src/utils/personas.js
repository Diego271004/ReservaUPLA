/** Las iniciales del avatar: la primera letra de las dos primeras palabras del nombre. */
export const iniciales = (nombreCompleto) =>
  String(nombreCompleto ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('')
