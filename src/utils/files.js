import { config } from '../config.js';

/**
 * Lectura, validación y compresión de archivos antes de persistirlos.
 * localStorage tiene un límite cercano a 5 MB: comprimimos imágenes y
 * rechazamos archivos demasiado pesados con un mensaje claro.
 */

export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateFile(
  file,
  { maxSize = config.ui.maxEvidenceSize, accept = 'image/' } = {},
) {
  if (!file) return { ok: false, message: 'No se seleccionó ningún archivo.' };
  if (maxSize && file.size > maxSize) {
    return {
      ok: false,
      message: `El archivo pesa ${formatBytes(file.size)}. El máximo permitido es ${formatBytes(maxSize)}.`,
    };
  }
  if (accept && !file.type.startsWith(accept)) {
    return { ok: false, message: 'El formato del archivo no es compatible.' };
  }
  return { ok: true, message: '' };
}

export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No fue posible leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export function compressImage(file, { maxDimension = 1200, quality = 0.82 } = {}) {
  if (
    !file ||
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.type === 'image/svg+xml'
  ) {
    return readAsDataURL(file);
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, width, height);

        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outputType, quality));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No fue posible procesar la imagen.'));
    };

    image.src = objectUrl;
  });
}

/**
 * Devuelve un data URL listo para guardar, comprimiendo imágenes.
 */
export async function prepareUpload(
  file,
  { maxSize = config.ui.maxEvidenceSize, accept = 'image/' } = {},
) {
  const validation = validateFile(file, { maxSize, accept });
  if (!validation.ok) throw new Error(validation.message);

  if (file.type.startsWith('image/')) {
    return compressImage(file, { maxDimension: 1200, quality: 0.82 });
  }
  return readAsDataURL(file);
}

export function downloadDataUrl(dataUrl, filename = 'archivo') {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
