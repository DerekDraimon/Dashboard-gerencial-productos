export const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

/** Spanish text per API error code; the server's own message is English and never shown. */
const MESSAGES: ReadonlyMap<string, string> = new Map(
  Object.entries({
    DATABASE_UNAVAILABLE:
      'La base de datos no está disponible en este momento. Inténtalo de nuevo más tarde.',
    INTERNAL_ERROR: 'Ocurrió un error en el servidor. Inténtalo de nuevo.',
    NOT_FOUND: 'El recurso solicitado no existe.',
    INVALID_ID: 'El identificador no es válido.',
    VALIDATION_ERROR: 'Algunos datos no son válidos. Revisa el formulario.',
    INVALID_JSON: 'La solicitud no tiene un formato válido.',
    PAYLOAD_TOO_LARGE: 'La solicitud es demasiado grande.',
    UNAUTHENTICATED: 'Debes iniciar sesión para continuar.',
    INVALID_TOKEN: 'Tu sesión expiró. Inicia sesión de nuevo.',
    FORBIDDEN: 'No tienes permiso para realizar esta acción.',
    INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
    USER_INACTIVE: 'Tu cuenta está inactiva. Contacta a un administrador.',
    TOO_MANY_REQUESTS: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
    EMAIL_ALREADY_EXISTS: 'Ya existe un usuario con ese correo.',
    USER_NOT_FOUND: 'El usuario no existe.',
    PRODUCT_NOT_FOUND: 'El producto no existe.',
    CANNOT_MODIFY_SELF: 'No puedes cambiar tu propio rol ni tu estado.',
  }),
);

export function apiErrorMessage(code: string): string {
  return MESSAGES.get(code) ?? UNEXPECTED_ERROR_MESSAGE;
}
