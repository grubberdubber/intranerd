/**
 * Configuración global de IntraNerd.
 * Permite sobreescribir valores en tiempo de ejecución desde index.html:
 *   window.INTRANERD_CONFIG = { api: { baseUrl: '/api', enabled: true } }
 */
const runtimeConfig = (typeof window !== 'undefined' && window.INTRANERD_CONFIG) || {};

const defaults = {
  app: {
    name: 'IntraNerd',
    version: '2.0.0',
    school: 'Colegio IntraNerd',
    tagline: 'Plataforma integral de gestión escolar',
  },
  api: {
    baseUrl: '/api',
    // La SPA intenta la API y, si no está disponible, degrada a localStorage.
    // Los adaptadores de `services/resources.js` traducen el contrato REST.
    enabled: true,
    timeout: 4000,
  },
  storage: {
    prefix: 'intranerd.v2',
    version: 2,
  },
  ui: {
    toastDuration: 4200,
    maxImageSize: 2.5 * 1024 * 1024,
    maxEvidenceSize: 4 * 1024 * 1024,
  },
};

function merge(base, override) {
  const output = { ...base };
  Object.entries(override || {}).forEach(([key, value]) => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof base[key] === 'object'
    ) {
      output[key] = merge(base[key], value);
    } else if (value !== undefined) {
      output[key] = value;
    }
  });
  return output;
}

export const config = merge(defaults, runtimeConfig);
export const APP_NAME = config.app.name;
