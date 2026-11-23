/**
 * Buscador de las tablas: revisa TODOS los campos que se le pasen.
 *
 * - No distingue mayúsculas ni tildes ("produccion" encuentra "En producción").
 * - Los números se comparan tal como se ven en pantalla y también sin puntos:
 *   "575.000" y "575000" encuentran un costo de $575.000.
 * - Si se escriben varias palabras, deben aparecer todas (en cualquier campo):
 *   "camilo pendiente" muestra las remisiones de Camilo que están pendientes.
 */
export type ValorBuscable = string | number | boolean | null | undefined | ValorBuscable[];

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const aTexto = (valor: ValorBuscable): string => {
  if (valor === null || valor === undefined) return '';
  if (Array.isArray(valor)) return valor.map(aTexto).join(' ');
  if (typeof valor === 'boolean') return valor ? 'si' : 'no';
  if (typeof valor === 'number') {
    const conPuntos = Math.round(valor).toLocaleString('es-CO'); // 575.000
    return `${valor} ${conPuntos} $${conPuntos}`;
  }
  return valor;
};

export const coincideBusqueda = (busqueda: string, campos: ValorBuscable[]): boolean => {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const texto = normalizar(campos.map(aTexto).join(' | '));
  return palabras.every(p => texto.includes(p));
};
