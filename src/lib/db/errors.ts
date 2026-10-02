export class DuplicateFieldError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "DuplicateFieldError";
    this.field = field;
  }
}

export class DeleteBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeleteBlockedError";
  }
}

export class ValidationError extends Error {
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

/** Choque con un recurso existente (p. ej. horario ocupado): se responde 409. */
export class ConflictError extends ValidationError {
  constructor(message: string, field?: string) {
    super(message, field);
    this.name = "ConflictError";
  }
}

/** El usuario no puede hacer esto sobre este recurso (p. ej. editar un registro ajeno): 403. */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
