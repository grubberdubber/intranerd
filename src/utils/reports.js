/**
 * Predicados puros de búsqueda, filtrado y ordenamiento para los módulos de
 * seguridad escolar y objetos perdidos.
 *
 * Se separan de las vistas para poder probarlos sin DOM (Vitest) y para que
 * ambas vistas compartan exactamente las mismas reglas de coincidencia.
 */

/** Normaliza un texto de búsqueda: sin espacios externos y en minúsculas. */
export function normalizeQuery(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Indica si alguno de los campos contiene el texto buscado.
 * Una búsqueda vacía coincide con todo.
 *
 * @param {string} query
 * @param {unknown[]} fields
 * @returns {boolean}
 */
export function matchesQuery(query, fields = []) {
  const needle = normalizeQuery(query);
  if (!needle) return true;
  return fields.some((value) =>
    String(value ?? '')
      .toLowerCase()
      .includes(needle),
  );
}

/**
 * Ordena reportes de personas: primero los activos, luego los encontrados.
 * Dentro de cada grupo, el más reciente aparece primero.
 *
 * @template {{ found?: boolean, createdAt?: string }} T
 * @param {T[]} reports
 * @returns {T[]} nuevo arreglo ordenado
 */
export function sortMissingReports(reports = []) {
  return reports
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(a.found)) - Number(Boolean(b.found)) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

/**
 * Filtra y ordena reportes de personas extraviadas.
 *
 * @template {{ found?: boolean, name?: string, place?: string, contact?: string, desc?: string, createdAt?: string }} T
 * @param {T[]} reports
 * @param {{ query?: string, status?: 'all' | 'active' | 'found' }} [filters]
 * @returns {T[]}
 */
export function filterMissingReports(reports = [], { query = '', status = 'all' } = {}) {
  return sortMissingReports(reports).filter((report) => {
    if (status === 'active' && report.found) return false;
    if (status === 'found' && !report.found) return false;
    return matchesQuery(query, [report.name, report.place, report.contact, report.desc]);
  });
}

/**
 * Ordena publicaciones de objetos por fecha de creación descendente.
 *
 * @template {{ createdAt?: string }} T
 * @param {T[]} items
 * @returns {T[]} nuevo arreglo ordenado
 */
export function sortByNewest(items = []) {
  return items
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Filtra y ordena objetos encontrados o avisos de perdidos por categoría y
 * texto. Los campos buscables son descripción, persona, lugar y contacto.
 *
 * @template {{ category?: string, desc?: string, by?: string, place?: string, contact?: string, createdAt?: string }} T
 * @param {T[]} items
 * @param {{ query?: string, category?: string }} [filters]
 * @returns {T[]}
 */
export function filterLostFoundItems(items = [], { query = '', category = 'all' } = {}) {
  return sortByNewest(items).filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    return matchesQuery(query, [item.desc, item.by, item.place, item.contact]);
  });
}
