/** Construye la metadata de paginación devuelta por los listados. */
export function buildPagination({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPreviousPage: page > 1,
  };
}

/** Convierte page/limit en offset para SQLite. */
export function toOffset(page, limit) {
  return (page - 1) * limit;
}
