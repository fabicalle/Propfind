const MAX_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILES = 5;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFiles(files: File[]): ValidationResult {
  if (!files || files.length === 0) {
    return { valid: false, error: 'Debes subir al menos una imagen de la propiedad.' };
  }

  if (files.length > MAX_FILES) {
    return { valid: false, error: `Solo puedes subir un máximo de ${MAX_FILES} imágenes.` };
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      return { valid: false, error: `El archivo "${file.name}" no es un formato permitido (solo JPG, PNG o WEBP).` };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `La imagen "${file.name}" supera el límite máximo de 3MB.` };
    }
  }

  return { valid: true };
}
